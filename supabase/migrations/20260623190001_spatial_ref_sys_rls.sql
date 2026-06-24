-- spatial_ref_sys is a PostGIS extension system table (SRID reference data,
-- no app data) that the Security Advisor flags for having RLS disabled in
-- the public schema. It's harmless to expose, but enabling RLS + an open
-- read policy clears the warning without changing behavior.
alter table public.spatial_ref_sys enable row level security;

create policy "spatial_ref_sys readable"
on public.spatial_ref_sys
for select
to anon, authenticated
using (true);
