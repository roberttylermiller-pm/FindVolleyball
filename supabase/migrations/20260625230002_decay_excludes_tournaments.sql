-- ROB-113: the 60-day no-upvote decay job exists to flag recurring
-- meetups that have gone quiet — it doesn't make sense for a
-- one-off dated tournament, which already disappears from the map on
-- its own once end_date passes (see fetchApproved.ts). Re-creates the
-- same function (cron.schedule already points at this name, see
-- 20260620200001) rather than altering it in place.
create or replace function public.flag_decayed_listings()
returns void
language sql
as $$
  update public.listings
  set decayed = true
  where status = 'approved'
    and decayed = false
    and listing_kind = 'recurring'
    and coalesce(last_upvote_at, created_at) < now() - interval '60 days';
$$;
