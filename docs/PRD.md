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
* Rate-limiting / spam prevention on submissions and reports
* Possible auto-moderation rules built from report + decay signal combination
