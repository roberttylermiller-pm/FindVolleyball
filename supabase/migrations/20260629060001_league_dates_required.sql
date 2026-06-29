-- ROB-116: renames the tournament-only date-consistency constraint to
-- something that doesn't imply it's tournament-specific, and extends
-- it to cover leagues too — but unlike a tournament, a league's
-- start/end date are optional (Robert's call, to avoid the upkeep
-- burden of keeping an ongoing league's dates current). So leagues
-- only need to satisfy end_date >= start_date when both are actually
-- provided; null/null is fine, as is one-without-the-other being
-- rejected at the application layer before it ever reaches here.
alter table public.listings drop constraint tournament_dates_consistent;

alter table public.listings
  add constraint dated_listing_dates_consistent
    check (
      (listing_kind <> 'tournament' or (start_date is not null and end_date is not null and end_date >= start_date))
      and (listing_kind <> 'league' or start_date is null or end_date is null or end_date >= start_date)
    );
