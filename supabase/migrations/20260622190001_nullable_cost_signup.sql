-- Cost and signup_required were required at MVP, but real-world listings
-- often genuinely don't have a known answer (e.g. "Unknown" cost from a
-- third-party rec center page) — null now means "not specified" rather
-- than forcing a guess. The existing check constraint on cost already
-- permits null (check constraints pass on null operands), so only the
-- not-null needs dropping.
alter table public.listings alter column cost drop not null;
alter table public.listings alter column signup_required drop not null;
