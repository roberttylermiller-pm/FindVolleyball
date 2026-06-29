-- ROB-116: leagues are dated events like tournaments (a start/end
-- month rather than a specific day, but stored the same way — first/
-- last calendar day of those months), so the date-consistency
-- constraint added for tournaments needs to cover leagues too. Drops
-- and re-adds under a clearer name rather than leaving a constraint
-- called "tournament_..." that also governs leagues.
alter table public.listings drop constraint tournament_dates_consistent;

alter table public.listings
  add constraint dated_listing_dates_consistent
    check (
      listing_kind not in ('tournament', 'league')
      or (start_date is not null and end_date is not null and end_date >= start_date)
    );
