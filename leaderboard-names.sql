-- Leaderboard names: never show any part of an email address.
-- Run this whole file once in Supabase > SQL Editor, after the leaderboard table exists. Safe to run again.
--
-- Until now, a player who joined the leaderboard without choosing a name was listed under the part of their
-- email address before the @. This file
--   1. renames every such row to "Player NNNN" (4 digits fixed per account, the same rule rewards.js uses), and
--   2. adds a trigger so a name that looks like an email address, or like the account's own email name, is
--      replaced on the way in, even if an old cached copy of the site still sends one.
-- A name the player chose themselves is left alone unless it is their email name.

-- "Player NNNN": the first 8 hex digits of the random account id, mod 10000 (matches defaultName in rewards.js)
create or replace function public.hu_player_name(p_user uuid)
returns text language sql immutable as $$
  select 'Player ' || lpad(((('x' || lpad(substr(replace(p_user::text, '-', ''), 1, 8), 16, '0'))::bit(64)::bigint) % 10000)::text, 4, '0')
$$;

-- true when the name is empty, contains an @, or equals the account's email name (case-insensitive)
create or replace function public.hu_name_is_emailish(p_name text, p_user uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select coalesce(btrim(p_name), '') = ''
      or position('@' in p_name) > 0
      or exists (select 1 from auth.users u
                  where u.id = p_user and u.email is not null
                    and lower(btrim(p_name)) in (lower(split_part(u.email, '@', 1)), lower(left(split_part(u.email, '@', 1), 24))))
$$;
revoke all on function public.hu_name_is_emailish(text, uuid) from public, anon, authenticated;

create or replace function public.hu_leaderboard_name_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.hu_name_is_emailish(new.name, new.user_id) then
    new.name := public.hu_player_name(new.user_id);
  end if;
  return new;
end $$;
revoke all on function public.hu_leaderboard_name_guard() from public, anon, authenticated;

drop trigger if exists leaderboard_name_guard on public.leaderboard;
create trigger leaderboard_name_guard before insert or update of name on public.leaderboard
  for each row execute function public.hu_leaderboard_name_guard();

-- migrate existing rows (the trigger does the renaming)
update public.leaderboard set name = name where public.hu_name_is_emailish(name, user_id);

-- Check: this should return 0.
select count(*) as names_still_like_email
  from public.leaderboard l
 where public.hu_name_is_emailish(l.name, l.user_id);
