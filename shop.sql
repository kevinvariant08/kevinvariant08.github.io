-- Coins and the shop: run this whole file once in Supabase > SQL Editor,
-- after setup.sql, leaderboard.sql, locks.sql and admin.sql. Safe to run again.
--
-- How it stays fair: the browser works out how many coins each day's activity earned,
-- but the database accepts only the last 7 days, never more than 400 coins for any one day,
-- and a day's total can only go up. Prices live here, and every purchase is checked here,
-- so editing the website cannot buy anything. Someone faking their activity can at most
-- earn 400 coins a day, so the expensive items still take weeks.

-- ---------------------------------------------------------------- catalogue
create table if not exists public.shop_items (
  id      text primary key,
  name    text not null,
  kind    text not null check (kind in ('title','theme','freeze','game','content','unlock')),
  price   int  not null check (price >= 0),
  scope   text,                    -- content: folder in the 'locked' bucket; unlock: paper key such as 'I1'
  active  boolean not null default true,
  sort    int  not null default 0,
  requires text                    -- another item that must be owned first
);
alter table public.shop_items add column if not exists requires text;
alter table public.shop_items enable row level security;
drop policy if exists "shop is public" on public.shop_items;
create policy "shop is public" on public.shop_items for select to anon, authenticated using (true);
grant select on public.shop_items to anon, authenticated;

insert into public.shop_items (id, name, kind, price, scope, sort, requires) values
  ('title-lemma',       'Lemma Hunter',            'title',     300, null,  10, null),
  ('title-telescoper',  'Telescoper',              'title',     600, null,  11, null),
  ('title-angle',       'Angle Chaser',            'title',     900, null,  12, null),
  ('title-vieta',       'Vieta''s Apprentice',     'title',    1300, null,  13, null),
  ('title-contra',      'Contrapositive Knight',   'title',    1800, null,  14, null),
  ('title-invariant',   'Invariant Seeker',        'title',    2600, null,  15, null),
  ('title-incenter',    'Incenter Initiate',       'title',    4000, null,  16, null),
  ('title-olympian',    'Olympian',                'title',    8000, null,  17, null),
  ('theme-blackboard',  'Blackboard',              'theme',    1200, null,  20, null),
  ('theme-nebula',      'Nebula',                  'theme',    1600, null,  21, null),
  ('theme-parchment',   'Parchment Night',         'theme',    2000, null,  22, null),
  ('freeze',            'Streak freeze',           'freeze',    250, null,  30, null),
  ('game-countdown',    'Labs: Target',            'game',      700, null,  40, null),
  ('game-nim',          'Labs: Nim Duel',          'game',      900, null,  41, null),
  ('bti-chapter',       'Beyond the Incenter, Chapter 1: Angle Chasing', 'content', 6000, 'bti-chapter', 50, null),
  ('bti-book',          'Beyond the Incenter: the complete book', 'content', 24000, 'bti-book', 51, 'bti-chapter'),
  ('unlock-I1',         'Set I Paper 1',           'unlock',   3000, 'I1',  60, null),
  ('unlock-I2',         'Set I Paper 2',           'unlock',   3000, 'I2',  61, null)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, price = excluded.price,
  scope = excluded.scope, sort = excluded.sort, requires = excluded.requires;

-- ---------------------------------------------------------------- ledger
create table if not exists public.coin_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  amount  int  not null default 0 check (amount >= 0),
  primary key (user_id, day)
);
create table if not exists public.purchases (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  item_id   text not null references public.shop_items(id),
  price     int  not null,
  bought_at timestamptz not null default now()
);
create index if not exists purchases_user on public.purchases (user_id);

alter table public.coin_days enable row level security;
alter table public.purchases enable row level security;
drop policy if exists "read own coins" on public.coin_days;
drop policy if exists "read own purchases" on public.purchases;
create policy "read own coins"     on public.coin_days for select to authenticated using (user_id = auth.uid());
create policy "read own purchases" on public.purchases for select to authenticated using (user_id = auth.uid());
grant select on public.coin_days, public.purchases to authenticated;
-- No insert/update/delete policies: only the functions below can change these tables.

-- ---------------------------------------------------------------- wallet
create or replace function public.hu_wallet()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); earned int; spent int; today_amt int; adm boolean;
begin
  if uid is null then return json_build_object('signed_in', false); end if;
  -- one-off welcome bonus, stored on a fixed early date so it never counts as "today"
  insert into public.coin_days (user_id, day, amount) values (uid, date '2000-01-01', 250) on conflict do nothing;
  select coalesce(sum(amount),0) into earned from public.coin_days where user_id = uid;
  select coalesce(sum(price),0)  into spent  from public.purchases where user_id = uid;
  select coalesce(max(amount),0) into today_amt from public.coin_days where user_id = uid and day = current_date;
  adm := public.hu_is_admin();
  return json_build_object(
    'signed_in', true, 'admin', adm,
    'balance', earned - spent, 'earned', earned, 'spent', spent,
    'today', today_amt, 'cap', 400,
    'counts', coalesce((select json_object_agg(item_id, n) from
               (select item_id, count(*) as n from public.purchases where user_id = uid group by item_id) c), '{}'::json));
end $$;

-- Record coins for recent days. p_days is a JSON array like [{"day":"2026-10-08","amount":120}, ...].
create or replace function public.hu_sync_coins(p_days jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r jsonb; d date; a int;
begin
  if uid is null then return json_build_object('signed_in', false); end if;
  for r in select * from jsonb_array_elements(coalesce(p_days, '[]'::jsonb)) loop
    begin
      d := (r->>'day')::date; a := greatest(0, least(400, coalesce((r->>'amount')::int, 0)));
    exception when others then continue; end;
    if d between current_date - 7 and current_date + 1 then
      insert into public.coin_days (user_id, day, amount) values (uid, d, a)
        on conflict (user_id, day) do update set amount = greatest(public.coin_days.amount, excluded.amount);
    end if;
  end loop;
  return public.hu_wallet();
end $$;

-- Buy an item. Returns {"ok":true,...wallet} or {"ok":false,"error":"..."}.
create or replace function public.hu_buy(p_item text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it public.shop_items%rowtype; bal int; owned int; recent int; adm boolean; cost int;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'Sign in to spend coins.'); end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));          -- one purchase at a time per person
  select * into it from public.shop_items where id = p_item and active;
  if not found then return json_build_object('ok', false, 'error', 'That item is not in the shop.'); end if;
  select count(*) into owned from public.purchases where user_id = uid and item_id = it.id;
  if it.kind <> 'freeze' and owned > 0 then return json_build_object('ok', true, 'already', true) ; end if;
  if it.kind = 'freeze' then
    select count(*) into recent from public.purchases where user_id = uid and item_id = it.id and bought_at > now() - interval '7 days';
    if recent >= 2 then return json_build_object('ok', false, 'error', 'You can buy at most two streak freezes a week.'); end if;
  end if;
  adm := public.hu_is_admin();
  if it.requires is not null and not adm and not exists
     (select 1 from public.purchases where user_id = uid and item_id = it.requires) then
    return json_build_object('ok', false, 'error', 'Unlock ' || coalesce((select name from public.shop_items where id = it.requires), it.requires) || ' first.');
  end if;
  cost := case when adm then 0 else it.price end;
  select coalesce((select sum(amount) from public.coin_days where user_id = uid),0)
       - coalesce((select sum(price)  from public.purchases where user_id = uid),0) into bal;
  if bal < cost then return json_build_object('ok', false, 'error', 'Not enough coins yet.'); end if;
  insert into public.purchases (user_id, item_id, price) values (uid, it.id, cost);
  if it.kind = 'unlock' and it.scope is not null then
    insert into public.unlocks (user_id, scope) values (uid, it.scope) on conflict do nothing;
  end if;
  return json_build_object('ok', true, 'item', it.id) ;
end $$;

revoke all on function public.hu_wallet() from public, anon;
revoke all on function public.hu_sync_coins(jsonb) from public, anon;
revoke all on function public.hu_buy(text) from public, anon;
grant execute on function public.hu_wallet(), public.hu_sync_coins(jsonb), public.hu_buy(text) to authenticated;

-- ---------------------------------------------------------------- bought content in the private bucket
-- Upload Chapter 1 as  locked/bti-chapter/chapter.pdf  and the whole book as  locked/bti-book/book.pdf
drop policy if exists "read purchased content" on storage.objects;
create policy "read purchased content" on storage.objects for select to authenticated using (
  bucket_id = 'locked' and exists (
    select 1 from public.purchases p join public.shop_items s on s.id = p.item_id
    where p.user_id = auth.uid() and s.kind = 'content' and s.scope = split_part(storage.objects.name, '/', 1)
  )
);

-- ---------------------------------------------------------------- titles on the leaderboard
alter table public.leaderboard add column if not exists title text check (title is null or char_length(title) <= 40);

-- Useful admin queries:
--   update public.shop_items set price = 5000 where id = 'bti-chapter';          -- change a price
--   update public.shop_items set active = false where id = 'unlock-I1';          -- take an item off sale
--   insert into public.coin_days (user_id, day, amount)                          -- gift 500 coins to someone
--     select id, date '2000-01-02', 500 from auth.users where email = 'friend@example.com'
--     on conflict (user_id, day) do update set amount = public.coin_days.amount + 500;
--   select s.name, count(*) from public.purchases p join public.shop_items s on s.id = p.item_id group by 1 order by 2 desc;
