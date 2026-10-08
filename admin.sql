-- Admin mode: run this whole file once in Supabase > SQL Editor (after locks.sql and timelock.sql).
-- Admins can open every locked paper, including time-locked ones before their release,
-- and the site shows them every level, badge and theme. Only accounts listed in public.admins count.

create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;   -- no policies: the browser can never read or change this table

create or replace function public.hu_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.hu_is_admin() from public, anon;
grant execute on function public.hu_is_admin() to authenticated;

-- Only this account is an admin: remove anyone else first (safe if the table is empty).
delete from public.admins where user_id not in (select id from auth.users where lower(email) = lower('kevin9649@dubaicollege.org'));

-- Add yourself. Use the email you sign in to the website with (sign up on the site first if you have not).
insert into public.admins (user_id)
  select id from auth.users where lower(email) = lower('kevin9649@dubaicollege.org')
  on conflict do nothing;

-- Admins can read every file in the private bucket, whatever its lock or release time.
drop policy if exists "admins read everything" on storage.objects;
create policy "admins read everything" on storage.objects for select to authenticated using (
  bucket_id = 'locked' and public.hu_is_admin()
);

-- Check it worked: this should return one row with your email.
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
