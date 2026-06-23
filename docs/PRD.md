# FindVolleyball — PRD

> Reflects the current shipped state of the product. For the history of how this evolved from the original v1 spec — and the reasoning behind each change — see the [Decisions Log](https://linear.app/robert-miller/document/play-volleyball-decisions-log-e625f8480dac).

## The Problem

Finding local volleyball meetups is difficult because information is fragmented across apps (Reclub, Meetup, Goodrec, Facebook Groups, etc.) and word of mouth.

## The Solution

A free, community-driven interactive map showing volleyball meetups. Each listing supplies meetup info and a link to its preferred organizing platform.

---

## Map & Filters

Viewing the map does **not** require sign-in. Filters available:

* **Type**: Indoor / Grass / Beach
* **Cost**: Free / Paid (a listing with no cost specified is treated as Free for filtering purposes)
* **Day of week**: defaults to all days selected
* **Location search**: City, State, or Zip — input is geocoded and the map zooms/centers to that location

Each listing also has a permanent, indexable detail page (`/courts/[slug]`) with its full address, a one-tap Maps link, and SEO metadata — separate from the map view, and server-rendered so it always reflects current data.

---

## Submitting an Entry

### Account Required

Submitting a listing requires an account. Supported sign-in methods:

* Google
* Email + password

*(Apple Sign-In is deferred — requires a paid Apple Developer Program membership with no signal yet that it's needed alongside Google/email.)*

### Listing Fields

**Required**

* Type: Indoor / Grass / Beach
* Location: address autocomplete or drop-a-pin map picker (geocoded to lat/lng, reverse-geocoded to a full mailing address)
* Days & Times: user selects one or more days; each selected day has an optional start time and optional end time

**Optional**

* Name
* Cost: Free / Paid / Not specified
* Sign-ups required in advance? (Yes/No/Not specified)
* External Link (Reclub, Meetup, Goodrec, etc. — supports `mailto:` as well)
* Minimum Skill Level (C, B, BB, A, AA)
* Equipment Supplied? (Yes/No)
* Payment Type (Venmo, Cash, etc.)
* Team Required? (Yes/No)
* Additional Notes (250 char max)
* Public (Open Gym) vs Private (Club)
* One photo per listing

Cost and "sign-ups required" are optional rather than forced, since real-world listings — especially ones sourced from a third party rather than self-reported by an organizer — often don't have a known answer.

### Review Workflow

All submissions are queued for **manual review** before appearing on the public map. No listing goes live automatically.

### Spam Protection

Submissions (along with votes and reports below) are protected by a honeypot field and per-IP rate limiting, enforced server-side. Submission additionally requires a verified signed-in session — the server forces `status: pending` and records the submitter regardless of what the client sends.

---

## Admin Dashboard

A private dashboard (Robert-only access) for:

* Reviewing and approving/rejecting pending listing submissions
* Editing any field on an existing listing directly (no need to ask a submitter to resubmit)
* Viewing reported listings and their attached notes, and archiving a report once it's been handled (archived reports are kept, not deleted, but drop out of the default view)
* Manually marking listings inactive/removed, or overriding decay status
* Sorting listings alphabetically, by date added, or by last upvoted

---

## Maintenance & Moderation

### Reporting

Any visitor can report a listing with a required note (250 char max). Reports are **logged silently** — no automatic action is taken. Robert reviews reports manually via the admin dashboard.

### Activity / Decay

Each listing has a "Still active?" thumbs up / thumbs down control, visible to all visitors (no sign-in required to vote).

* If a listing receives **no upvote for 60 days**, it is automatically flagged and displayed on the map as **"Decayed"** (visually distinct, e.g. greyed out or badge).
* Decayed listings remain visible but visually deprioritized; there is currently no auto-removal or re-confirmation flow (see Open Items).

---

## Site & SEO

* **About and Privacy pages**, linked from the header on every page.
* **Buy Me a Coffee** link for optional voluntary support.
* **Vercel Web Analytics** for traffic visibility.
* Custom domain: **findvolleyball.app**, with a real logo and Open Graph share image.
* Sitemap covers both static pages and live listing detail pages (fetched at build time so SSR-rendered listing pages still get indexed).

---

## Tech Stack

* **Frontend**: Astro (hybrid static + server-rendered routes), deployed on Vercel
* **Map Engine**: Leaflet.js — lightweight (~42kb), no cost
* **Database**: Supabase (PostgreSQL with built-in PostGIS for geographic queries)
* **Auth**: Supabase Auth (Google, email/password)
* **Geocoding**: Nominatim (OpenStreetMap), free tier

---

## Data Coverage

Seeded with real, first-hand and community-sourced listings across Greater LA / San Fernando Valley, Orange County, the Inland Empire, and San Diego.

---

## Open Items for Future Iterations

* Decayed-listing removal policy (auto-remove vs. permanent badge vs. re-confirmation flow)
* Whether "Days & Times" should support recurring exceptions (e.g. holiday cancellations)
* Possible auto-moderation rules built from report + decay signal combination
* Apple Sign-In, if iOS-specific demand shows up
* Multi-admin support / permission levels, if moderation load grows beyond one person

---

## Changelog

A short pointer list of the most significant changes from the original v1 spec. Full reasoning for each lives in the [Decisions Log](https://linear.app/robert-miller/document/play-volleyball-decisions-log-e625f8480dac).

* Cost and "sign-ups required" became optional fields, not required.
* Spam/rate-limiting protection shipped for votes, reports, and submissions.
* `/courts/[slug]` converted from static generation to server-rendered, so listing pages always reflect current data.
* Day-of-week filter, full address + Maps link, admin edit-any-field, and report archiving were added beyond the original spec.
* Programmatic SEO (listing detail pages, sitemap) was added mid-project as a competitive differentiator.
* About/Privacy pages, analytics, custom domain, and branding were added during launch polish.
