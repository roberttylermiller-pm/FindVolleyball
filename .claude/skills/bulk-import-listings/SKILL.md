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
- Some rows include a separate `import_notes` field — unlike `notes`, this IS meant for the DB. It means Robert has already resolved whatever caveat the scraping `notes` raised (e.g. phone-confirmed a detail after the scrape) and is handing back the exact visitor-facing text to publish. When present, use `import_notes` as the DB `notes` value directly (still trim to 250 chars) instead of trying to extract something from the exploratory `notes` field.
- `import_notes` can also carry direct override instructions rather than just finished notes text — e.g. "Setup for every day, no time list" (replace `days_times` with all 7 days, no start/end) or "Add note: <text>" (use `<text>` as the DB notes). Read it as an instruction from Robert, not scraped data, and follow it literally.

This was gotten wrong once already (2026-06-30, Bay Area ROB-133 + Portland imports) — scraped commentary went live on the public map/permalink pages until Robert manually cleaned it up.

## Data quality gate before importing

Some batches include an explicit `include: true/false` field per row — this is the scraping agent's own recommendation after weighing scope/confidence/activity signals. **Trust it: import `include: true` rows, skip `include: false` rows, without asking.** Robert confirmed this rule directly (2026-07-01, ROB-135) after being asked about it — no need to re-confirm on future batches. Note when a row's freeform `notes` text contradicts its own `include` flag (this has happened — notes said "include" while the field said `false`); when that happens, still trust the structured `include` field, only flag it to Robert if it's genuinely unclear which one is stale.

When there's no `include` field (older/simpler batch shape), or a row has a caveat the scraping agent flagged as needing action rather than just informational (see below), review each row and surface judgment calls to Robert with `AskUserQuestion` rather than silently guessing:
- Missing or vague `days_times` (day-only, no start/end time) combined with a note like "could not confirm."
- A listing explicitly flagged as outside the requested search scope/area (only when there's no `include` field already resolving this).
- Contradictions between `days_times` and `notes` (e.g. an implausible overnight time span alongside "could not find published hours" — likely a placeholder, not real data).
- Anything the agent's own notes call uncertain, unconfirmed, or worth excluding — "verify before publishing," "confirm current status," etc.

Batch all the judgment calls into one `AskUserQuestion` call rather than asking one at a time.

## Handling different scraped JSON shapes

The scraping agent's output format has varied between batches — don't assume a fixed schema, read what's actually there:
- Some batches use an array of `{listing_kind, name, type, ..., days_times: [{day, start_time, end_time}]}` objects directly.
- Some batches wrap listings in `{metro, general_notes, listings: [...]}` with a different per-row shape: `days_selected: [day, ...]` (a list of day codes) plus a single top-level `start_time`/`end_time` shared by all of them — expand this into one `days_times` entry per day in `days_selected`, each carrying the same start/end time.
- Field types vary too — `signup_required` may be a real boolean or the literal string `"true"`/`"false"`; `cost` may be `null`, `""` (empty string), or `"unknown"` — all three mean "unspecified," normalize to `null` per the rule above.
- `google_maps_url` may be an empty string rather than absent — treat both the same as "no link."

## Field normalizations (apply silently, no need to ask)

- `type: "sand"` → our schema's surface enum is `indoor | grass | beach`; map `sand` to `beach`.
- `cost: "unknown"` (or any value other than `free`/`paid`) → `null`. `null` means "unspecified," which is exactly what "unknown" means — don't invent a third cost state.
- `end_time: "24:00"` → normalize to `23:59`. The DB stores plain `"HH:MM"` strings and `formatDayTime` (`src/lib/listings/formatDayTime.ts`) renders hour 24 as "12:00 PM" (wrong) since it has no special-case for midnight.
- A single `days_times` entry can't cross midnight into the next day (no next-day rollover in the schema) — if scraped hours run past midnight (e.g. "11am-1am"), cap that day's `end_time` at `23:59` and flag it in the data-quality gate below rather than silently guessing whether to shift it to the next day's entry.

## lat/lng priority

For each row, in this order:
1. **Decode `google_maps_url`** — this is a link Robert enters/verifies by hand and is the most trustworthy location signal available. Resolve short links (`maps.app.goo.gl`, `goo.gl`) by following the redirect, then extract coordinates the same way `src/lib/listings/googleMapsUrl.ts`'s `decodeGoogleMapsUrl` does: prefer the `!3d{lat}!4d{lng}` place-pin pattern, fall back to the `@lat,lng,zoom` viewport-center pattern.
2. If the xlsx/JSON already has explicit `lat`/`lng` columns filled in (not always the case), those take priority when there's no Maps link — they mean the scraping agent already resolved coordinates itself.
3. **Missing/empty `google_maps_url` (and no explicit lat/lng): stop and ask Robert before importing that row.** Ideally every row has a Maps link — a missing one means the location signal is weaker (Nominatim address-search results can land on the wrong building, especially with suite numbers or ambiguous addresses). Surface these rows with `AskUserQuestion` (batched with any other judgment calls for the ticket) rather than silently falling back to forward-geocoding `submitted_address`. Only forward-geocode if Robert explicitly approves it for that row.
4. If Robert approves forward-geocoding, strip suite/unit numbers (e.g. `#110`) if the plain address-only geocode fails — Nominatim frequently can't resolve street+suite combos.

## Check for an existing listing before inserting

The scraping agent doesn't have visibility into what's already in the DB, so a batch can re-submit a listing already imported in an earlier ticket — sometimes as a genuine duplicate, sometimes as a follow-up correction with better data (e.g. a vague schedule later confirmed with real times) once Robert or the agent found more specific info. This happened 2026-07-01 (ROB-138 re-submitted ROB-136's "The Volley Gang" listing with corrected days_times).

Before inserting any row, check for an existing row with the same `name` (`select id,name,lat,lng,days_times,notes from listings where name ilike '%...%'`). If one exists at the same address/coordinates, flag it to Robert with `AskUserQuestion` rather than silently choosing — ask whether to `UPDATE` the existing row (typical when the new data is more complete/corrected) or insert a second row anyway. Don't skip this check just because the row looks routine.

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
