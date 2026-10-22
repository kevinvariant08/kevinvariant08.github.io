-- Shop items that unlock Sets E, F, G, H and K with coins. Run once in Supabase > SQL Editor, after shop.sql.
insert into public.shop_items (id, name, kind, price, scope, sort, requires) values
  ('unlock-K1', 'Set K Paper 1', 'unlock', 3500, 'K1', 62, null),
  ('unlock-K2', 'Set K Paper 2', 'unlock', 3500, 'K2', 63, null),
  ('unlock-H1', 'Set H Paper 1', 'unlock', 2500, 'H1', 64, null),
  ('unlock-H2', 'Set H Paper 2', 'unlock', 2500, 'H2', 65, null),
  ('unlock-G1', 'Set G Paper 1', 'unlock', 2500, 'G1', 66, null),
  ('unlock-G2', 'Set G Paper 2', 'unlock', 2500, 'G2', 67, null),
  ('unlock-F1', 'Set F Paper 1', 'unlock', 1500, 'F1', 68, null),
  ('unlock-F2', 'Set F Paper 2', 'unlock', 1500, 'F2', 69, null),
  ('unlock-E1', 'Set E Paper 1', 'unlock', 1500, 'E1', 70, null),
  ('unlock-E2', 'Set E Paper 2', 'unlock', 1500, 'E2', 71, null)
on conflict (id) do update set price = excluded.price, active = true;

-- Check: should list the ten new items.
select id, price from public.shop_items where id like 'unlock-%' order by sort;
