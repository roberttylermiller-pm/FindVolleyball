# Play Volleyball — PRD

> Locked as v1 baseline 2026-06-20. Source of truth: [Linear doc](https://linear.app/robert-miller/document/play-volleyball-prd-v1-ee57dfec78d3).

## The Problem

Finding local volleyball meetups is difficult because information is fragmented across apps (Reclub, Meetup, Goodrec, Facebook Groups, etc.) and word of mouth.

## The Solution

A free, community-driven interactive map showing volleyball meetups. Each listing supplies meetup info and a link to its preferred organizing platform.

---

## Map & Filters

Viewing the map does **not** require sign-in. Filters available:

* **Type**: Indoor / Grass / Beach
* **Cost**: Free / Paid
* **Location search**: City, State, or Zip — input is geocoded and the map zooms/centers to that location

---

## Submitting an Entry

### Account Required

Submitting a listing requires an account. Supported sign-in methods:

* Google
* Apple
* Email + password

### Listing Fields

**Required**

* Type: Indoor / Grass / Beach
* Cost: Free / Paid
* Location: address autocomplete or drop-a-pin map picker (geocoded to lat/lng)
* Days & Times: user selects one or more days; each selected day has an optional start time and optional end time
* Sign-ups required in advance? (Yes/No)

**Optional**

* Name
* External Link (Reclub, Meetup, Goodrec, etc.)
* Minimum Skill Level (C, B, BB, A, AA)
* Equipment Supplied? (Yes/No)
* Additional Notes (250 char max)
* Public (Open Gym) vs Private (Club)

### Review Workflow

All submissions are queued for **manual review** before appearing on the public map. No listing goes live automatically.

---

## Admin Dashboard

A private dashboard (Robert-only access) for:

* Reviewing and approving/rejecting pending listing submissions
* Viewing reported listings and their attached notes
* Manually marking listings inactive/removed
* (Future) bulk actions, decay overrides

---

## Maintenance & Moderation

### Reporting

Any visitor can report a listing with a required note (250 char max). Reports are **logged silently** — no automatic action is taken. Robert reviews reports manually via the admin dashboard.

### Activity / Decay

Each listing has a "Still active?" thumbs up / thumbs down control, visible to all visitors (no sign-in required to vote).

* If a listing receives **no upvote for 60 days**, it is automatically flagged and displayed on the map as **"Decayed"** (visually distinct, e.g. greyed out or badge).
* Decayed listings remain visible but visually deprioritized; future iterations may auto-remove or require re-confirmation.

---

## Tech Stack

* **Frontend**: Astro — instant load speeds, low-bloat SEO
* **Map Engine**: Leaflet.js — lightweight (~42kb), no cost
* **Styling**: Standard CSS Modules using native nesting
* **Database**: Supabase (PostgreSQL with built-in PostGIS for geographic queries)
* **Auth**: Supabase Auth (Google, Apple, email/password)

*Stack selected based on recommendations from the Fireship YouTube channel.*

---

## MVP Scope: Seed Region

Initial seed data will cover **Los Angeles / San Fernando Valley**, where Robert has first-hand organizer knowledge of existing meetups.

---

## Open Items for Future Iterations

* Decayed-listing removal policy (auto-remove vs. permanent badge vs. re-confirmation flow)
* Whether "Days & Times" should support recurring exceptions (e.g. holiday cancellations)
* Possible auto-moderation rules built from report + decay signal combination

---

## Final Shipped State (2026-06-23)

> Everything above is the locked v1 spec, kept as the historical baseline. This section is additive — what actually shipped, including where it deviated from v1 and why. See the [Decisions Log](https://linear.app/robert-miller/document/play-volleyball-decisions-log-e625f8480dac) for the full reasoning behind each change.

### Deviations from v1

* **Apple Sign-In deferred.** Requires a paid Apple Developer Program membership ($99/yr) with no signal yet that iOS users specifically need it over Google/email. Revisit if that demand shows up.
* **Cost and "Sign-ups required?" are optional, not required.** Real-world listings (especially imported from third-party sources rather than self-reported by an organizer) often genuinely don't have a known answer — both fields now accept "Not specified" rather than forcing a guess at submission time. Cost filters treat "unknown" the same as "Free" rather than hiding those listings from anyone filtering by cost.
* **Rate-limiting / spam prevention is no longer an open item — it shipped.** Honeypot field + per-IP rate limiting on votes, reports, and submissions, with submissions now requiring a verified session server-side rather than trusting client-supplied data. See decisions log for why this took more than the original estimate (no server layer existed for these writes at all until this pass).

### Built beyond the original spec

* **Day-of-week filter**, alongside Type and Cost, defaulting to all days selected.
* **Full mailing address + one-tap Maps link** on every listing (not just lat/lng), backed by reverse geocoding.
* **Admin dashboard edit-any-field capability** — v1 only specified approve/reject/inactive/decay-override; admin can now correct any submitted field directly rather than asking the submitter to resubmit.
* **Report archiving** — reports can be cleared from the default dashboard view (not deleted) once handled, so the queue reflects what's still unprocessed.
* **Programmatic SEO** (`/courts/[slug]` pages, sitemap, per-listing meta tags) — proposed and built mid-project (M2.5) as a pivot once the competitive landscape made clear that static, indexable listing pages were the one capability no embedded-widget competitor could replicate.
* **About + Privacy pages**, Buy Me a Coffee link, Vercel Web Analytics, custom domain (findvolleyball.app), and a real logo/OG share image — none specified in v1, added during the launch-polish milestone.

### Still open (unchanged from v1)

* Decayed-listing removal policy — decayed listings still just sit there, visually deprioritized, indefinitely.
* Recurring-schedule exceptions (e.g. holiday cancellations).
* Auto-moderation rules from combined report + decay signal.

### Data coverage at launch

Seeded with real, first-hand and community-sourced listings across Greater LA / San Fernando Valley, Orange County, the Inland Empire, and San Diego — substantially broader than the original "LA/SFV only" MVP scope, since organizer-knowledge and community tracking-sheet sources were available for those areas too.
