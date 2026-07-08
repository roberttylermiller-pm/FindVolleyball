create table public.external_link_clicks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index external_link_clicks_listing_id_idx on public.external_link_clicks (listing_id);

alter table public.external_link_clicks enable row level security;

-- Same pattern as reports: anyone (including anonymous visitors) can log a
-- click, but no select policy is defined — reads only happen through the
-- service-role admin client, which bypasses RLS entirely.
create policy "Anyone can log an external link click"
  on public.external_link_clicks for insert
  to anon, authenticated
  with check (true);
