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
| Auth     | Supabase Auth (Google, Apple, email/password)      |

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

Most of the site is statically generated, but `/api/admin/*` routes need a server at runtime (they use the service-role key, which can never ship to the browser) — the project uses `@astrojs/node` in standalone mode:

```bash
npm run build
node ./dist/server/entry.mjs
```

`npm run preview` also works for local testing.

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

## Project Tracking

Work is tracked in Linear (project: *Play Volleyball*) across milestones M0–M7, from initial setup through map browsing, auth, submissions, admin moderation, voting/decay, and launch polish.
