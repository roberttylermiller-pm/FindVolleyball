-- ROB-86: lets the admin dashboard clear a report once it's been
-- looked at, instead of the list only ever growing.
alter table public.reports add column archived boolean not null default false;
