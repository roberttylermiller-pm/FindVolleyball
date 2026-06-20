create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  note text not null check (char_length(note) <= 250),
  created_at timestamptz not null default now()
);

create index reports_listing_id_idx on public.reports (listing_id);

alter table public.reports enable row level security;

-- Anyone (including anonymous visitors) can file a report. No select policy
-- is defined — reports aren't readable through the public API at all; admin
-- review (M5) happens via the service-role server client, which bypasses
-- RLS entirely. This matches the PRD: reports are logged silently.
create policy "Anyone can submit a report"
  on public.reports for insert
  to anon, authenticated
  with check (true);
