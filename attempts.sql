-- Smart Practice: an anonymous log of answers, used only to calibrate how hard each question is.
-- Run this whole file once in Supabase > SQL Editor. Safe to run again.
--
-- What is stored for each answer: a random id made by the visitor's browser (never linked to an account),
-- the question id, the option chosen, right or wrong, seconds taken, when it was answered, the practice mode,
-- and when the server received it. Nothing else: no user id, name, email, IP address or free text.
-- None of these functions reads auth.uid() or request headers, so a row cannot be tied to a signed-in account.
--
-- The browser can only call hu_log_attempts() (add answers) and hu_forget_attempts() (delete its own answers).
-- It can never read the table. The weekly calibration reads it through hu_export_attempts(), which needs a
-- secret calibration key; only a SHA-256 hash of that key is stored here.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- table
create table if not exists public.attempts (
  id          bigint generated always as identity primary key,
  anon_id     uuid        not null,
  question_id text        not null check (question_id ~ '^[A-L][12]-([1-9]|1[0-9]|20)$'),
  chosen      text        not null check (chosen ~ '^[A-H]$'),
  correct     boolean     not null,
  secs        int         not null check (secs between 0 and 7200),
  answered_at timestamptz not null,
  mode        text        not null check (mode ~ '^[a-z]{2,12}$'),
  received_at timestamptz not null default now()
);
create unique index if not exists attempts_once     on public.attempts (anon_id, question_id, answered_at);
create index        if not exists attempts_by_anon  on public.attempts (anon_id, received_at);
create index        if not exists attempts_received on public.attempts (received_at);

alter table public.attempts enable row level security;   -- no policies: the browser has no direct access
revoke all on public.attempts from anon, authenticated;

-- ---------------------------------------------------------------- add answers (browser)
-- p_rows: JSON array of at most 50 objects {"q":"B1-7","c":"C","ok":true,"s":95,"t":"2026-10-24T10:00:00Z","m":"smart"}.
-- Limits: 300 answers per anonymous id per hour, 3 stored answers per question per id, answers at most
-- 30 days old, and a site-wide brake of 3000 answers a minute. Bad rows are skipped, not fatal.
create or replace function public.hu_log_attempts(p_anon uuid, p_rows jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  r jsonb; n int; recent int; per_q int; rc int; kept int := 0; skipped int := 0;
  v_q text; v_c text; v_ok boolean; v_s int; v_t timestamptz; v_m text;
begin
  if p_anon is null or p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return json_build_object('ok', false, 'error', 'bad request');
  end if;
  n := jsonb_array_length(p_rows);
  if n > 50 then return json_build_object('ok', false, 'error', 'too many rows'); end if;
  perform pg_advisory_xact_lock(hashtext(p_anon::text));          -- one batch at a time per id
  select count(*) into recent from public.attempts where anon_id = p_anon and received_at > now() - interval '1 hour';
  if recent + n > 300 then return json_build_object('ok', false, 'error', 'rate limited', 'retry', true); end if;
  select count(*) into recent from public.attempts where received_at > now() - interval '1 minute';
  if recent > 3000 then return json_build_object('ok', false, 'error', 'busy', 'retry', true); end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    begin
      v_q := r->>'q'; v_c := r->>'c'; v_ok := (r->>'ok')::boolean; v_s := round((r->>'s')::numeric)::int;
      v_t := (r->>'t')::timestamptz; v_m := r->>'m';
      if v_t is null or v_t < now() - interval '30 days' or v_t > now() + interval '1 day' then
        skipped := skipped + 1; continue;
      end if;
      select count(*) into per_q from public.attempts where anon_id = p_anon and question_id = v_q;
      if per_q >= 3 then skipped := skipped + 1; continue; end if;
      insert into public.attempts (anon_id, question_id, chosen, correct, secs, answered_at, mode)
        values (p_anon, v_q, v_c, v_ok, v_s, v_t, v_m)
        on conflict do nothing;
      get diagnostics rc = row_count;
      if rc = 1 then kept := kept + 1; else skipped := skipped + 1; end if;
    exception when others then
      skipped := skipped + 1;                                        -- failed a check constraint or bad JSON
    end;
  end loop;
  return json_build_object('ok', true, 'kept', kept, 'skipped', skipped);
end $$;

-- ---------------------------------------------------------------- delete my answers (browser, privacy page)
-- Only the browser knows its random id, so only it can delete its rows.
create or replace function public.hu_forget_attempts(p_anon uuid)
returns json language plpgsql security definer set search_path = public as $$
declare rc int;
begin
  delete from public.attempts where anon_id = p_anon;
  get diagnostics rc = row_count;
  return json_build_object('ok', true, 'deleted', rc);
end $$;

-- ---------------------------------------------------------------- export (weekly calibration only)
create table if not exists public.calibration_keys (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  note     text,
  added_at timestamptz not null default now()
);
alter table public.calibration_keys enable row level security;   -- no policies: never visible to the browser
revoke all on public.calibration_keys from anon, authenticated;

-- Returns up to p_limit rows with id > p_after, oldest first, as a JSON array; null if the key is wrong.
create or replace function public.hu_export_attempts(p_key text, p_after bigint default 0, p_limit int default 5000)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_key is null or not exists (select 1 from public.calibration_keys
      where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')) then
    return null;
  end if;
  return coalesce((select json_agg(row_to_json(a) order by a.id) from (
    select id, anon_id, question_id, chosen, correct, secs, answered_at, mode
    from public.attempts where id > coalesce(p_after, 0) order by id
    limit greatest(1, least(coalesce(p_limit, 5000), 10000))) a), '[]'::json);
end $$;

revoke all on function public.hu_log_attempts(uuid, jsonb)            from public;
revoke all on function public.hu_forget_attempts(uuid)                from public;
revoke all on function public.hu_export_attempts(text, bigint, int)   from public;
grant execute on function public.hu_log_attempts(uuid, jsonb)          to anon, authenticated;
grant execute on function public.hu_forget_attempts(uuid)              to anon, authenticated;
grant execute on function public.hu_export_attempts(text, bigint, int) to anon, authenticated;

-- ---------------------------------------------------------------- calibration key (do this once)
-- 1. On your own computer, in PowerShell, make a key and its hash (the key never goes into Supabase):
--      $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $k = ($b | % { '{0:x2}' -f $_ }) -join ''; $k
--      $h = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($k))).Replace('-','').ToLower(); $h
-- 2. Here, store only the hash:
--      insert into public.calibration_keys (key_hash, note) values ('PASTE-THE-HASH', 'GitHub Actions');
-- 3. In GitHub > Settings > Secrets and variables > Actions, add a secret KV_CALIBRATION_KEY with the key itself.
-- To revoke it later:  delete from public.calibration_keys where note = 'GitHub Actions';

-- Check it worked (both should be 0 rows / false for the browser roles):
--   select count(*) from public.attempts;
--   select has_table_privilege('anon', 'public.attempts', 'select');
