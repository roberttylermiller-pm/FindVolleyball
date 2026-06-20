create extension if not exists pg_cron;

-- A listing decays if it's been 60+ days since its last upvote — or,
-- for listings that have never been upvoted, 60+ days since it was
-- created. (There's no separate "approved_at" timestamp; created_at is
-- close enough for now since most listings are approved shortly after
-- submission — worth revisiting if that assumption stops holding.)
-- Already-decayed listings are excluded so this is a cheap incremental
-- scan rather than rewriting every decayed row every day.
create or replace function public.flag_decayed_listings()
returns void
language sql
as $$
  update public.listings
  set decayed = true
  where status = 'approved'
    and decayed = false
    and coalesce(last_upvote_at, created_at) < now() - interval '60 days';
$$;

select cron.schedule(
  'flag-decayed-listings-daily',
  '0 3 * * *',
  $$ select public.flag_decayed_listings(); $$
);
