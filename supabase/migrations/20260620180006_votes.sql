create table public.votes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now()
);

create index votes_listing_id_idx on public.votes (listing_id);

alter table public.votes enable row level security;

-- No sign-in required to vote, per PRD — open insert/select to anon.
-- No dedup/rate-limiting yet (see PRD Open Items); flagged as a future
-- consideration rather than built now.
create policy "Anyone can vote"
  on public.votes for insert
  to anon, authenticated
  with check (true);

create policy "Vote counts are publicly readable"
  on public.votes for select
  to anon, authenticated
  using (true);

-- Keeps listings.last_upvote_at current so the M6 decay job can scan an
-- indexed column instead of aggregating this table.
create function public.handle_new_vote()
returns trigger
language plpgsql
as $$
begin
  if new.vote_type = 'up' then
    update public.listings
    set last_upvote_at = new.created_at,
        decayed = false
    where id = new.listing_id;
  end if;
  return new;
end;
$$;

create trigger votes_handle_new_vote
  after insert on public.votes
  for each row execute function public.handle_new_vote();
