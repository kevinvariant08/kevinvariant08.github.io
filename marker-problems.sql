-- Proof marker problems written in the Problem editor (marker-admin.html).
-- Run this whole file once in Supabase > SQL Editor, after admin.sql.
--
-- Who can do what:
--   everyone (signed in or not)  reads published problems, and the list of hidden built-in problems
--   admins (public.admins)       read drafts too, and create, edit, hide and delete problems

create table if not exists public.marker_problems (
  id          text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  status      text not null check (status in ('published', 'draft', 'hidden')),
  data        jsonb,
  source_md   text check (source_md is null or length(source_md) < 200000),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
alter table public.marker_problems enable row level security;

-- Newer Supabase projects do not give the website (the anon and authenticated roles) access to new tables
-- automatically, so grant it here. The row-level security policies below still decide who can do what.
grant select on public.marker_problems to anon, authenticated;
grant insert, update, delete on public.marker_problems to authenticated;

drop policy if exists "anyone reads published problems" on public.marker_problems;
create policy "anyone reads published problems" on public.marker_problems
  for select to anon, authenticated using (status in ('published', 'hidden'));

drop policy if exists "admins read everything" on public.marker_problems;
create policy "admins read everything" on public.marker_problems
  for select to authenticated using (public.hu_is_admin());

drop policy if exists "admins add problems" on public.marker_problems;
create policy "admins add problems" on public.marker_problems
  for insert to authenticated with check (public.hu_is_admin());

drop policy if exists "admins edit problems" on public.marker_problems;
create policy "admins edit problems" on public.marker_problems
  for update to authenticated using (public.hu_is_admin()) with check (public.hu_is_admin());

drop policy if exists "admins delete problems" on public.marker_problems;
create policy "admins delete problems" on public.marker_problems
  for delete to authenticated using (public.hu_is_admin());

-- keep updated_at honest
create or replace function public.marker_problems_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists marker_problems_touch on public.marker_problems;
create trigger marker_problems_touch before insert or update on public.marker_problems
  for each row execute function public.marker_problems_touch();

-- Check it worked: this should return 0 rows and no error.
select id, status from public.marker_problems;
