-- Kevinvariant classes: a teacher makes a class, students join with a six-character code,
-- the teacher sets Pathways units or level checks and sees each member's Pathways progress.
-- Run this whole file once in Supabase > SQL Editor, after setup.sql (it reads public.progress). Safe to run again.
--
-- What a teacher can see about a member, and nothing else: the display name the student chose for that class,
-- the Pathways units they have marked done or started, their level-check scores (total and by strand),
-- when they joined, and when their progress last synced. Never an email address, never any other progress.
-- All of it is read through class_progress(), which checks that the caller owns the class.
-- A student who leaves a class (deletes their class_members row) disappears from it at once.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables
create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  join_code  text not null unique check (join_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  created_at timestamptz not null default now(),
  archived   boolean not null default false
);
create index if not exists classes_by_owner on public.classes (owner);

create table if not exists public.class_members (
  class_id     uuid not null references public.classes(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40 and display_name !~ '[[:cntrl:]<>]'),
  joined_at    timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists class_members_by_user on public.class_members (user_id);

create table if not exists public.class_assignments (
  id         bigint generated always as identity primary key,
  class_id   uuid not null references public.classes(id) on delete cascade,
  kind       text not null check (kind in ('unit', 'check')),
  ref        text not null,
  note       text check (note is null or char_length(note) <= 200),
  due_date   date,
  created_at timestamptz not null default now(),
  constraint class_assignments_ref check (
    (kind = 'unit'  and ref ~ '^L[1-5]-[A-Z]{1,3}[0-9]{1,2}$') or
    (kind = 'check' and ref ~ '^[1-5]$')),
  constraint class_assignments_once unique (class_id, kind, ref)
);
create index if not exists class_assignments_by_class on public.class_assignments (class_id);

-- failed join attempts, for the rate limit only (never readable from the browser)
create table if not exists public.class_join_attempts (
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index if not exists class_join_attempts_by_user on public.class_join_attempts (user_id, at);

-- ---------------------------------------------------------------- helpers (used by the policies)
-- security definer so that the policies on classes and class_members do not call each other in a loop
create or replace function public.hu_class_owner(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class and owner = auth.uid());
$$;
create or replace function public.hu_class_member(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where class_id = p_class and user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- row level security
alter table public.classes             enable row level security;
alter table public.class_members       enable row level security;
alter table public.class_assignments   enable row level security;
alter table public.class_join_attempts enable row level security;   -- no policies: the browser has no access

drop policy if exists "owner or member reads class" on public.classes;
drop policy if exists "owner renames or archives"   on public.classes;
drop policy if exists "owner deletes class"         on public.classes;
create policy "owner or member reads class" on public.classes for select to authenticated
  using (owner = auth.uid() or public.hu_class_member(id));
create policy "owner renames or archives"   on public.classes for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
create policy "owner deletes class"         on public.classes for delete to authenticated
  using (owner = auth.uid());
-- no insert policy: classes are made only through create_class(), which enforces the limit and makes the code

-- A student sees only their own membership rows (never classmates); the teacher reads members through class_progress().
drop policy if exists "member reads own row"    on public.class_members;
drop policy if exists "member renames self"     on public.class_members;
drop policy if exists "member leaves"           on public.class_members;
create policy "member reads own row" on public.class_members for select to authenticated
  using (user_id = auth.uid());
create policy "member renames self"  on public.class_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "member leaves"        on public.class_members for delete to authenticated
  using (user_id = auth.uid());
-- no insert policy: joining is only through join_class()

drop policy if exists "owner or member reads assignments" on public.class_assignments;
drop policy if exists "owner adds assignments"            on public.class_assignments;
drop policy if exists "owner edits assignments"           on public.class_assignments;
drop policy if exists "owner removes assignments"         on public.class_assignments;
create policy "owner or member reads assignments" on public.class_assignments for select to authenticated
  using (public.hu_class_owner(class_id) or public.hu_class_member(class_id));
create policy "owner adds assignments"    on public.class_assignments for insert to authenticated
  with check (public.hu_class_owner(class_id));
create policy "owner edits assignments"   on public.class_assignments for update to authenticated
  using (public.hu_class_owner(class_id)) with check (public.hu_class_owner(class_id));
create policy "owner removes assignments" on public.class_assignments for delete to authenticated
  using (public.hu_class_owner(class_id));

-- Table privileges: only the columns each side may change.
revoke all on public.classes, public.class_members, public.class_assignments, public.class_join_attempts from anon, authenticated;
grant select, delete         on public.classes           to authenticated;
grant update (name, archived) on public.classes          to authenticated;
grant select, delete         on public.class_members     to authenticated;
grant update (display_name)  on public.class_members     to authenticated;
grant select, insert, delete on public.class_assignments to authenticated;
grant update (note, due_date) on public.class_assignments to authenticated;

-- At most 100 items set in one class.
create or replace function public.hu_class_assignment_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.class_assignments where class_id = new.class_id) >= 100 then
    raise exception 'A class can have at most 100 items set. Remove some first.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists class_assignment_cap on public.class_assignments;
create trigger class_assignment_cap before insert on public.class_assignments
  for each row execute function public.hu_class_assignment_cap();

-- ---------------------------------------------------------------- join codes
-- Six characters from 31 that cannot be confused when read aloud or copied: no 0, O, 1, I or L.
create or replace function public.hu_new_join_code()
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea; code text; i int; tries int := 0;
begin
  loop
    b := extensions.gen_random_bytes(6); code := '';
    for i in 0..5 loop code := code || substr(alphabet, 1 + (get_byte(b, i) % 31), 1); end loop;
    exit when not exists (select 1 from public.classes where join_code = code);
    tries := tries + 1;
    if tries > 20 then raise exception 'could not make a join code'; end if;
  end loop;
  return code;
end $$;

-- ---------------------------------------------------------------- teacher: make a class (at most 10 active)
create or replace function public.create_class(p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_name text := btrim(coalesce(p_name, '')); n int; r public.classes;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'Sign in to make a class.'); end if;
  if char_length(v_name) < 1 or char_length(v_name) > 60 then
    return json_build_object('ok', false, 'error', 'Give the class a name of up to 60 characters.');
  end if;
  perform pg_advisory_xact_lock(hashtext('hu_class_owner:' || uid::text));
  select count(*) into n from public.classes where owner = uid and not archived;
  if n >= 10 then return json_build_object('ok', false, 'error', 'You can have at most 10 active classes. Archive or delete one first.'); end if;
  select count(*) into n from public.classes where owner = uid;
  if n >= 40 then return json_build_object('ok', false, 'error', 'You have 40 classes including archived ones. Delete some first.'); end if;
  insert into public.classes (owner, name, join_code) values (uid, v_name, public.hu_new_join_code()) returning * into r;
  return json_build_object('ok', true, 'id', r.id, 'name', r.name, 'join_code', r.join_code, 'created_at', r.created_at);
end $$;

-- teacher: replace a class's join code (if it has been shared too widely); existing members stay
create or replace function public.new_class_code(p_class uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not public.hu_class_owner(p_class) then return json_build_object('ok', false, 'error', 'That is not one of your classes.'); end if;
  v := public.hu_new_join_code();
  update public.classes set join_code = v where id = p_class;
  return json_build_object('ok', true, 'join_code', v);
end $$;

-- ---------------------------------------------------------------- student: join with a code
-- Returns only the class the code belongs to. Ten wrong codes in 15 minutes locks joining for that account
-- for the rest of the 15 minutes, so codes cannot be guessed (31^6 is about 890 million codes).
create or replace function public.join_class(p_code text, p_display_name text)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_name text := btrim(regexp_replace(coalesce(p_display_name, ''), '\s+', ' ', 'g'));
  c public.classes; n int;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'Sign in to join a class.'); end if;
  if char_length(v_name) < 1 or char_length(v_name) > 40 or v_name ~ '[[:cntrl:]<>]' then
    return json_build_object('ok', false, 'error', 'Choose a display name of up to 40 characters, without < or >.');
  end if;
  perform pg_advisory_xact_lock(hashtext('hu_join:' || uid::text));
  select count(*) into n from public.class_join_attempts where user_id = uid and at > now() - interval '15 minutes';
  if n >= 10 then return json_build_object('ok', false, 'error', 'Too many wrong codes. Wait 15 minutes, then try again.'); end if;
  if v_code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$' then
    insert into public.class_join_attempts (user_id) values (uid);
    return json_build_object('ok', false, 'error', 'A class code is six letters and digits, such as K7MP3Q. Check it with your teacher.');
  end if;
  select * into c from public.classes where join_code = v_code and not archived;
  if not found then
    insert into public.class_join_attempts (user_id) values (uid);
    return json_build_object('ok', false, 'error', 'No class has that code. Check it with your teacher.');
  end if;
  if exists (select 1 from public.class_members where class_id = c.id and user_id = uid) then
    update public.class_members set display_name = v_name where class_id = c.id and user_id = uid;
    return json_build_object('ok', true, 'already', true, 'class_id', c.id, 'name', c.name);
  end if;
  perform pg_advisory_xact_lock(hashtext('hu_class:' || c.id::text));
  select count(*) into n from public.class_members where class_id = c.id;
  if n >= 60 then return json_build_object('ok', false, 'error', 'That class is full (60 students). Ask your teacher.'); end if;
  select count(*) into n from public.class_members where user_id = uid;
  if n >= 20 then return json_build_object('ok', false, 'error', 'You are in 20 classes already. Leave one first.'); end if;
  insert into public.class_members (class_id, user_id, display_name) values (c.id, uid, v_name);
  return json_build_object('ok', true, 'class_id', c.id, 'name', c.name);
end $$;

-- ---------------------------------------------------------------- teacher: progress of the members
-- One row per member: display name, units marked done, units started, level-check scores
-- ({"3": {"score": 6, "t": 1731500000000, "by": {"NT": 2, "AL": 1, "CO": 2, "GE": 1}}}), and the last sync time.
-- Only those fields are read out of the member's synced progress; everything else in it stays private.
create or replace function public.class_progress(p_class uuid)
returns table (user_id uuid, display_name text, joined_at timestamptz, units text[], started text[], checks jsonb, last_active timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.hu_class_owner(p_class) then
    raise exception 'That is not one of your classes.' using errcode = '42501';
  end if;
  return query
  with m as (
    select cm.user_id, cm.display_name, cm.joined_at, p.updated_at,
      case when jsonb_typeof(p.data -> 'kv_path' -> 'u') = 'object' then p.data -> 'kv_path' -> 'u' else '{}'::jsonb end as u,
      case when jsonb_typeof(p.data -> 'kv_diag') = 'object' then p.data -> 'kv_diag' else '{}'::jsonb end as d
    from public.class_members cm left join public.progress p on p.user_id = cm.user_id
    where cm.class_id = p_class
  )
  select m.user_id, m.display_name, m.joined_at,
    coalesce((select array_agg(e.key order by e.key) from jsonb_each(m.u) e
      where e.key ~ '^L[1-5]-[A-Z]{1,3}[0-9]{1,2}$' and jsonb_typeof(e.value) = 'object'
        and jsonb_typeof(e.value -> 'done') = 'number'), '{}'::text[]),
    coalesce((select array_agg(e.key order by e.key) from jsonb_each(m.u) e
      where e.key ~ '^L[1-5]-[A-Z]{1,3}[0-9]{1,2}$' and jsonb_typeof(e.value) = 'object'
        and jsonb_typeof(e.value -> 'done') is distinct from 'number'
        and (jsonb_typeof(e.value -> 'read') = 'number'
          or (jsonb_typeof(e.value -> 'ps') = 'object' and e.value -> 'ps' <> '{}'::jsonb)
          or (jsonb_typeof(e.value -> 'lad') = 'object' and e.value -> 'lad' <> '{}'::jsonb))), '{}'::text[]),
    coalesce((select jsonb_object_agg(e.key, jsonb_build_object(
        'score', (e.value ->> 'score')::int,
        't', case when jsonb_typeof(e.value -> 't') = 'number' then e.value -> 't' else 'null'::jsonb end,
        'by', coalesce((select jsonb_object_agg(s.key, (s.value #>> '{}')::int) from jsonb_each(
                 case when jsonb_typeof(e.value -> 'by') = 'object' then e.value -> 'by' else '{}'::jsonb end) s
               where s.key in ('NT', 'AL', 'CO', 'GE') and (s.value #>> '{}') ~ '^[0-2]$'), '{}'::jsonb)))
      from jsonb_each(m.d) e
      where e.key ~ '^[1-5]$' and jsonb_typeof(e.value) = 'object' and (e.value ->> 'score') ~ '^[0-8]$'), '{}'::jsonb),
    m.updated_at
  from m
  order by lower(m.display_name);
end $$;

-- teacher: remove a student from a class
create or replace function public.remove_class_member(p_class uuid, p_user uuid)
returns json language plpgsql security definer set search_path = public as $$
declare rc int;
begin
  if not public.hu_class_owner(p_class) then return json_build_object('ok', false, 'error', 'That is not one of your classes.'); end if;
  delete from public.class_members where class_id = p_class and user_id = p_user;
  get diagnostics rc = row_count;
  return json_build_object('ok', true, 'removed', rc);
end $$;

-- ---------------------------------------------------------------- who may call what
revoke all on function public.hu_class_owner(uuid)              from public, anon;
revoke all on function public.hu_class_member(uuid)             from public, anon;
revoke all on function public.hu_class_assignment_cap()         from public, anon, authenticated;
revoke all on function public.hu_new_join_code()                from public, anon, authenticated;
revoke all on function public.create_class(text)                from public, anon;
revoke all on function public.new_class_code(uuid)              from public, anon;
revoke all on function public.join_class(text, text)            from public, anon;
revoke all on function public.class_progress(uuid)              from public, anon;
revoke all on function public.remove_class_member(uuid, uuid)   from public, anon;
grant execute on function public.hu_class_owner(uuid)            to authenticated;
grant execute on function public.hu_class_member(uuid)           to authenticated;
grant execute on function public.create_class(text)              to authenticated;
grant execute on function public.new_class_code(uuid)            to authenticated;
grant execute on function public.join_class(text, text)          to authenticated;
grant execute on function public.class_progress(uuid)            to authenticated;
grant execute on function public.remove_class_member(uuid, uuid) to authenticated;

-- Old failed join attempts are only needed for 15 minutes. To tidy up now and then:
--   delete from public.class_join_attempts where at < now() - interval '1 day';

-- Check it worked (run as yourself in the SQL editor these show every row; the browser sees only its own):
--   select id, name, join_code, archived from public.classes order by created_at desc limit 5;
