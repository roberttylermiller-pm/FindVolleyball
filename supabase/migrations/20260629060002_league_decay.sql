-- ROB-116: a league's start/end dates are optional (see the previous
-- migration), so there's often no end_date to ever drop it off the
-- map on its own the way a tournament does. Robert's call: decay it
-- after 6 months of no upvotes instead — much longer than a recurring
-- meetup's 60 days, since a league runs for a season rather than
-- being a weekly drop-in. Re-creates the same function (cron.schedule
-- already points at this name) rather than altering it in place.
create or replace function public.flag_decayed_listings()
returns void
language sql
as $$
  update public.listings
  set decayed = true
  where status = 'approved'
    and decayed = false
    and (
      (listing_kind = 'recurring' and coalesce(last_upvote_at, created_at) < now() - interval '60 days')
      or (listing_kind = 'league' and coalesce(last_upvote_at, created_at) < now() - interval '6 months')
    );
$$;
