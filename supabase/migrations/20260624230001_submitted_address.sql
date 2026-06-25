-- ROB-104: preserves whatever raw address text the submitter typed,
-- separate from `address` (the clean, reverse-geocoded mailing address
-- set at approval time). Without this, a submission where geocoding
-- fails or the user never picked an autocomplete suggestion left admin
-- with nothing to go on besides the lat/lng pin.
alter table public.listings add column submitted_address text;
