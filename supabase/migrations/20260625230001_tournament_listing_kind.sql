-- ROB-113: tournaments are one-off dated events rather than weekly
-- recurring meetups, so they need a start/end date instead of
-- days_times (left as an empty array for these rows) and a way to tell
-- the two kinds apart for map icon/filtering/decay purposes. 'league'
-- is included in the check constraint now since the /submit tabbed UI
-- already names it as a coming third tab (ROB-116) — avoids a second
-- migration just to widen this same constraint later.
alter table public.listings
  add column listing_kind text not null default 'recurring'
    check (listing_kind in ('recurring', 'tournament', 'league')),
  add column start_date date,
  add column end_date date,
  add constraint tournament_dates_consistent
    check (
      listing_kind <> 'tournament'
      or (start_date is not null and end_date is not null and end_date >= start_date)
    );
