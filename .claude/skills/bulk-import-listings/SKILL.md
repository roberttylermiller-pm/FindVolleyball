---
name: bulk-import-listings
description: Import scraped volleyball listing data (xlsx from volleyball_listing_import_template.xlsx, or JSON in the same shape) directly into Supabase as approved listings. Use whenever Robert shares a file of scraped meetups/tournaments/leagues from his scraping agent and asks to import/add them.
---

# Bulk Import Listings

Robert runs a separate scraping agent that finds real-world volleyball meetups/tournaments/leagues and hands the results back as an xlsx (using `volleyball_listing_import_template.xlsx`'s tab structure: Meetups/Tournaments/Leagues) or an equivalent JSON array. This skill imports that data straight into the live `listings` table as `status='approved'` — bypassing the pending-review queue, since Robert has already reviewed the scraped data himself before sharing it.

## Critical rule: strip agent commentary from `notes`

The scraped data almost always includes a `notes` field (plus `confidence` and `source_url`). **These are the scraping agent talking to Robert** — confidence caveats, "confirm before publishing," "you may want to exclude this," attendee-count evidence for why it trusts a listing. They are NOT visitor-facing content.

**Never copy the scraped `notes` field verbatim into the DB `notes` column.** For each row:
- Read the scraped `notes` text.
- Discard anything that is meta-commentary about the scrape itself (confidence, publish-readiness, "I could not confirm X", attendee counts as evidence).
- Only keep genuinely visitor-useful facts (format details like "2v2 co-ed", skill-level requirements, "message organizer for exact court", equipment notes) — rewritten in neutral third-person listing language, not the agent's original phrasing. Trim to fit the 250-char DB limit.
- If nothing in the scraped notes is visitor-appropriate, leave the DB `notes` column null. Don't force it.
- Never write `confidence` or `source_url` to any DB column — they don't exist as fields on `listings` and aren't meant to.

This was gotten wrong once already (2026-06-30, Bay Area ROB-133 + Portland imports) — scraped commentary went live on the public map/permalink pages until Robert manually cleaned it up.

## Data quality gate before importing

Before writing anything to the DB, review every row for problems the scraping agent itself may have flagged, and surface them to Robert with `AskUserQuestion` rather than silently guessing:
- Missing or vague `days_times` (day-only, no start/end time) combined with a note like "could not confirm."
- A listing explicitly flagged as outside the requested search scope/area.
- Contradictions between `days_times` and `notes` (e.g. an implausible overnight time span alongside "could not find published hours" — likely a placeholder, not real data).
- Anything the agent's own notes call uncertain, unconfirmed, or worth excluding.

Batch all the judgment calls into one `AskUserQuestion` call rather than asking one at a time.

## lat/lng priority

For each row, in this order:
1. **Decode `google_maps_url`** — this is a link Robert enters/verifies by hand and is the most trustworthy location signal available. Resolve short links (`maps.app.goo.gl`, `goo.gl`) by following the redirect, then extract coordinates the same way `src/lib/listings/googleMapsUrl.ts`'s `decodeGoogleMapsUrl` does: prefer the `!3d{lat}!4d{lng}` place-pin pattern, fall back to the `@lat,lng,zoom` viewport-center pattern.
2. **Forward-geocode `submitted_address`** via Nominatim only if there's no Maps link, or it fails to decode. Strip suite/unit numbers (e.g. `#110`) if the address-only geocode fails — Nominatim frequently can't resolve street+suite combos.
3. If the xlsx/JSON already has explicit `lat`/`lng` columns filled in (not always the case), those take priority over both — they mean the scraping agent already resolved coordinates itself.

## Per-row processing

1. Parse the row (xlsx: skip title/instruction rows, header is row 3, kind is locked per-tab; JSON: `listing_kind` field per record).
2. Resolve `lat`/`lng` per the priority order above.
3. Reverse-geocode the resolved lat/lng via Nominatim (same call `reverseGeocode` in `src/lib/geocode.ts` makes) to get `city`, `neighborhood`, `address`.
4. Build the slug exactly like `buildListingSlug` in `src/lib/slug.ts`: `[city]-[neighborhood?]-[type]-[name-slug-or-id-prefix]`, then check uniqueness against existing `slug` values in the DB (append `-2`, `-3`, ... on collision), matching `findUniqueSlug` in `src/lib/listings/pseo.ts`.
5. A tournament row with no `start_date`/`end_date` violates the DB's `tournament_dates_consistent` constraint — if the row's own notes describe it as an ongoing/recurring series rather than a single event, import it as `listing_kind='recurring'` instead (flag this choice to Robert, don't silently decide for ambiguous cases).
6. Insert with `status='approved'`, `decayed=false`, `submitted_by=null`, `last_verified_date=now()`.
7. Respect Nominatim's ~1 req/sec usage policy — sleep ~1.1s between geocoding calls, and set a descriptive `User-Agent` header (see `src/lib/geocode.ts` for the exact string used elsewhere in this app).

## Credentials

Read `PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the project's `.env` file at runtime — never hardcode the key inline in a script (the harness's permission classifier blocks writes containing what looks like an embedded secret).

## After importing

Report a clear per-row summary (name, city, kind, any corrections made) and call out anything skipped or flagged for Robert's judgment, same as the data-quality gate above.
