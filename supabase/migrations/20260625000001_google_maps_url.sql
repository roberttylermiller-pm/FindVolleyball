-- ROB-99: lets a submitter supply the actual Google Maps page for a
-- listing (useful when the venue isn't well represented by a plain
-- address search, e.g. an unnamed park court). When present, the
-- listing's address link uses this directly instead of a constructed
-- maps search query.
alter table public.listings add column google_maps_url text;
