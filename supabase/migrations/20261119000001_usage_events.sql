create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  event text not null check (event in ('list_opened', 'list_card_clicked')),
  created_at timestamptz not null default now()
);

create index usage_events_event_created_at_idx on public.usage_events (event, created_at);

alter table public.usage_events enable row level security;

-- Same pattern as external_link_clicks: anyone can log an event, but no
-- select policy is defined, so reads only happen through the service-role
-- admin client.
create policy "Anyone can log a usage event"
  on public.usage_events for insert
  to anon, authenticated
  with check (true);
