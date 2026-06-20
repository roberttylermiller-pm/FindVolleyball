# Play Volleyball

A free, community-driven interactive map for finding local volleyball meetups — a curated alternative to listings scattered across Reclub, Meetup, Goodrec, and Facebook Groups.

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
  types/          Shared TypeScript types (incl. generated DB types)
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

```bash
npm run build
npm run preview
```

## Project Tracking

Work is tracked in Linear (project: *Play Volleyball*) across milestones M0–M7, from initial setup through map browsing, auth, submissions, admin moderation, voting/decay, and launch polish.
