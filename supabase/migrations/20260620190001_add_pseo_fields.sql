-- Adds fields needed for programmatic SEO court pages. Existing columns
-- (type, cost, external_link) are left untouched — they're already
-- referenced by RLS policies, nearby_listings(), and the seed script, and
-- renaming them would be a breaking change with no functional benefit.
alter table public.listings
  add column city text,
  add column neighborhood text,
  -- Distinct from votes-driven last_upvote_at/decayed: this tracks when a
  -- listing's *display data* (location, category) was last confirmed via
  -- geocoding/admin review, not "is this meetup still happening."
  add column last_verified_date timestamptz,
  -- Persisted rather than computed at request time, so a listing's URL
  -- stays stable even if the geocoding result would shift slightly on a
  -- re-run. Uniqueness is enforced here; collision handling (numeric
  -- suffix on duplicate name+neighborhood) happens in application code.
  add column slug text unique;

create index listings_slug_idx on public.listings (slug);
