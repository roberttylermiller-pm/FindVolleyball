create table public.listings (
  id uuid primary key default gen_random_uuid(),

  -- Required fields
  type text not null check (type in ('indoor', 'grass', 'beach')),
  cost text not null check (cost in ('free', 'paid')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  -- Synced from lat/lng by a trigger (see 20260620180004) — this is what
  -- spatial queries/the GIST index run against.
  location geography(point, 4326),
  -- [{ day: 'mon', start_time: '18:00' | null, end_time: '20:00' | null }, ...]
  days_times jsonb not null,
  signup_required boolean not null,

  -- Optional fields
  name text,
  external_link text,
  min_skill_level text check (min_skill_level in ('C', 'B', 'BB', 'A', 'AA')),
  equipment_supplied boolean,
  notes text check (char_length(notes) <= 250),
  visibility text not null default 'public' check (visibility in ('public', 'private')),

  -- System fields
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decayed boolean not null default false,
  -- Denormalized so the 60-day decay job (M6) is a cheap indexed scan
  -- instead of an aggregate join against the votes table on every run.
  last_upvote_at timestamptz,
  submitted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_submitted_by_idx on public.listings (submitted_by);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

alter table public.listings enable row level security;

create policy "Approved listings are publicly readable"
  on public.listings for select
  to anon, authenticated
  using (status = 'approved');

create policy "Submitters can view their own listings"
  on public.listings for select
  to authenticated
  using (submitted_by = auth.uid());

create policy "Authenticated users can submit listings"
  on public.listings for insert
  to authenticated
  with check (submitted_by = auth.uid() and status = 'pending');
