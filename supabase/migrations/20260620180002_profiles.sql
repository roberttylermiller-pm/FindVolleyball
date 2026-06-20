-- Mirrors auth.users with app-specific fields. Named `profiles` (not `users`)
-- to avoid confusion with Supabase's built-in auth.users table.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Admin actions (M5) go through the service-role server client, which
-- bypasses RLS entirely — so the only RLS policy needed here is letting a
-- signed-in user read their own profile.
create policy "Profiles are viewable by their owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);
