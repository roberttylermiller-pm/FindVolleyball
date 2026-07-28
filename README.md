# FindVolleyball

A free, community-driven interactive map for finding local volleyball meetups — a curated alternative to listings scattered across Reclub, Meetup, Goodrec, and Facebook Groups.

Built and tracked under the working name "Play Volleyball" — renamed to FindVolleyball once that name turned out to be taken. Repo/Linear project names are legacy references to that working name.

Full product spec: [docs/PRD.md](docs/PRD.md). Decision history: [Linear Decisions Log](https://linear.app/robert-miller/document/play-volleyball-decisions-log-e625f8480dac).

## Tech Stack

| Layer    | Choice                                            |
| -------- | -------------------------------------------------- |
| Frontend | [Astro](https://astro.build)                       |
| Map      | [Leaflet.js](https://leafletjs.com)                |
| Styling  | CSS Modules with native nesting                    |
| Database | [Supabase](https://supabase.com) (PostgreSQL + PostGIS) |
| Auth     | Supabase Auth (Google, email/password)      |

## Project Structure

```
src/
  components/     UI components
  layouts/        Shared page layouts
  lib/
    supabase/
      client.ts   Browser-side Supabase client (anon key)
      server.ts   Server-only Supabase client (service role key)
  pages/          Astro routes
  styles/         Global CSS
  types/          Hand-written domain types (e.g. Listing)
docs/             Product docs (PRD, etc.)
supabase/
  migrations/     SQL migrations for schema changes
scripts/          One-off scripts (e.g. seed data loader)
```

## Setup

### Prerequisites

- Node.js >= 22.12
- A [Supabase](https://supabase.com) project

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project's values (Project Settings → API in the Supabase dashboard):

```bash
cp .env.example .env
```

| Variable                      | Where to find it                              | Exposed to browser? |
| ------------------------------ | ---------------------------------------------- | -------------------- |
| `PUBLIC_SUPABASE_URL`          | Project Settings → API → Project URL           | Yes |
| `PUBLIC_SUPABASE_ANON_KEY`     | Project Settings → API → anon/public key       | Yes |
| `SUPABASE_SERVICE_ROLE_KEY`    | Project Settings → API → service_role key      | No — server-only, never commit |

### Run the dev server

```bash
npm run dev
```

### Build for production

Most of the site is statically generated, but `/api/admin/*` routes need a server at runtime (they use the service-role key, which can never ship to the browser) — the project deploys to [Vercel](https://vercel.com) via `@astrojs/vercel`.

```bash
npm run build
npm run preview
```

**Deploying:** the build runs `getStaticPaths` against Supabase to generate `/courts/[slug]` pages, so the three env vars above must be set in the Vercel project (Settings → Environment Variables), not just your local `.env` — otherwise the build fails with `supabaseUrl is required`.

### Database schema

SQL migrations live in `supabase/migrations/`, applied in filename order. Until the Supabase CLI is linked to the project, run them via the Supabase dashboard's SQL Editor.

### Seeding data

`scripts/seed.ts` inserts the listings defined in `scripts/seed-data/sfv-listings.ts` directly into the `listings` table (as already-approved, bypassing the review queue — intended for trusted, first-hand data, not user submissions):

```bash
npm run seed
```

### Programmatic SEO

Every approved listing with a `slug` gets a static `/courts/[slug]` page (e.g. `/courts/los-angeles-encino-grass-balboa-park`) with a generated `<title>`/meta description, built at `npm run build` time. `city`/`neighborhood`/`slug` are assigned via reverse geocoding (Nominatim) rather than entered manually — `npm run seed` does this automatically for new seed listings; for any listings missing those fields, run:

```bash
npm run backfill-pseo
```

## Listing Discovery & Curation Pipeline

New listings (recurring meetups/drop-in gyms, leagues, and tournaments) are sourced by an AI research agent working through a repeatable playbook, not entered by hand one at a time. The agent never writes to Supabase directly — every pass produces a self-contained, offline-reviewable HTML file that Robert reviews, edits, and exports from before anything is imported.

**Two listing types, two workflows.** Recurring meetups/drop-in gyms (`days_times` jsonb) and tournaments/leagues (`start_date`/`end_date`) are always staged as separate output files, even for the same venue, since they map to different schema fields.

**Sourcing** spans Meetup (richest source — attendee counts signal real activity), Yelp, city/county parks & rec sites, Volo Sports and other regional pickup-sports operators, Facebook/Reddit for word-of-mouth spots, and dedicated league/tournament platforms like VolleyballLife.com — scoped to a single organization's event page or run as a filtered statewide sweep. A real browser session is used as a fallback for JS-rendered pages a plain fetch can't read.

**Quality bar before a candidate is included:**

- Confidence rating (High/Medium/Low) based on concrete evidence — attendee counts, a published facility schedule, a confirmed city program — not just a page existing
- Adult-only by default; youth/juniors-capped listings excluded unless explicitly requested
- No clinics/classes — open-play with an optional coached warm-up is fine, instruction-first sessions aren't
- Court rentals (pay-to-reserve booking) don't qualify — only organized/open group sessions count
- One address per listing — a group/series that alternates venues is split into separate listings rather than combined
- No fabricated URLs or addresses — anything unconfirmed is flagged in notes, never guessed
- Back-to-back "seasons" of the same series (Session 4 → Session 5) are consolidated into one listing spanning the full known date range, not duplicated

**Output** is a single HTML file (no build step) with one card per candidate — source link, address, confidence badge, notes, and editable fields matching the `listings` schema — an include/exclude toggle per card, one-click JSON export (clean import payload or a fuller payload for a research follow-up pass), and local autosave so in-progress review isn't lost.

**Deduplication:** before a batch is import-ready, the agent cross-checks candidates against the live `listings` table by city, venue, and organization name to catch overlap with previously imported metros or packages.

The pipeline has run across 40+ US and Canadian metros for recurring meetups/drop-in gyms, plus dedicated packages for individual organizations and platform-wide sweeps (e.g. a full-state tournament/league pull from VolleyballLife.com).

## Project Tracking

Work is tracked in Linear (project: *Play Volleyball*) across milestones M0–M7, from initial setup through map browsing, auth, submissions, admin moderation, voting/decay, and launch polish.
