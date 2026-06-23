-- ROB-79: votes/reports/listing-submission previously inserted directly
-- from the browser to Supabase under wide-open RLS policies
-- (`with check (true)` on votes/reports — anyone, including a script
-- hitting the REST API directly, could insert any number of rows).
-- Moving all three writes behind server API routes that enforce a
-- honeypot field and per-IP rate limiting, backed by service-role
-- access — so the direct-insert policies need to go, or the new
-- endpoints would just be a parallel, bypassable path.
drop policy if exists "Anyone can vote" on public.votes;
drop policy if exists "Anyone can submit a report" on public.reports;
drop policy if exists "Authenticated users can submit listings" on public.listings;

-- Plain counter table for rate limiting — service-role only (no RLS
-- policies at all, RLS enabled means deny-by-default for anon/
-- authenticated). `key` is typically `${action}:${ip}`.
create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_key_created_at_idx on public.rate_limit_events (key, created_at);

alter table public.rate_limit_events enable row level security;

-- Old events are write-once, read-briefly (counted within a short
-- window) — nothing needs them after a day, so they're not worth an
-- index-bloating accumulation. Run manually/ad hoc rather than via
-- pg_cron, since this is much lower-stakes than the decay job.
create or replace function public.prune_rate_limit_events()
returns void
language sql
as $$
  delete from public.rate_limit_events where created_at < now() - interval '1 day';
$$;
