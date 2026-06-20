-- Keeps the PostGIS geography column in sync with lat/lng. This can't be a
-- generated column because ST_MakePoint/ST_SetSRID aren't marked IMMUTABLE
-- by Postgres, which generated columns require — a trigger is the standard
-- workaround. lat/lng stay as plain columns so app code can read/write them
-- without touching PostGIS functions.
create function public.sync_listing_location()
returns trigger
language plpgsql
as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

create trigger listings_sync_location
  before insert or update on public.listings
  for each row execute function public.sync_listing_location();

create index listings_location_gix on public.listings using gist (location);
create index listings_status_idx on public.listings (status);
create index listings_last_upvote_at_idx on public.listings (last_upvote_at);

-- Radius search backing the map view (M2). Returns approved listings within
-- radius_meters of the given point.
create function public.nearby_listings(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision
)
returns setof public.listings
language sql
stable
as $$
  select *
  from public.listings
  where status = 'approved'
    and ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
$$;
