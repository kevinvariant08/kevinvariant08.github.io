/* Runs setup.sql and classes.sql on a real (in-process) PostgreSQL and checks what a teacher and a student
   can and cannot do through row level security and the RPCs.
   Once:  cd tools && npm install        Then:  node tools/test_classes_sql.mjs */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let fails = 0, passes = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } else passes++; };

const db = new PGlite({ extensions: { pgcrypto } });
/* a minimal stand-in for Supabase: roles, auth.users and auth.uid() */
await db.exec(`create role anon nologin; create role authenticated nologin; create schema extensions; create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, extensions, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;`);
await db.exec(read('setup.sql'));
await db.exec('grant select, insert, update, delete on public.progress to authenticated;');
await db.exec(read('classes.sql'));
await db.exec(read('classes.sql'));                       // safe to run again

const T = randomUUID(), S1 = randomUUID(), S2 = randomUUID(), X = randomUUID(), T2 = randomUUID();
for (const [id, e] of [[T, 't@x'], [S1, 's1@x'], [S2, 's2@x'], [X, 'x@x'], [T2, 't2@x']])
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, e]);

async function as(uid, q, params) {
  await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await db.query(q, params); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
async function fails_(uid, q, params, re = /permission denied|violates row-level|not one of your|new row violates/i) {
  try { await as(uid, q, params); return false; } catch (e) { return re.test(e.message); }
}
const rpc = async (uid, q, params) => (await as(uid, q, params)).rows[0].r;

/* 1. anon can do nothing */
check(await fails_(null, 'select * from public.classes'), 'anon reads classes');
check(await fails_(null, `select public.join_class('ABCDEF', 'x') as r`), 'anon calls join_class');
check(await fails_(null, `select public.create_class('x') as r`), 'anon calls create_class');

/* 2. teacher makes a class; code shape */
const c1 = await rpc(T, `select public.create_class($1) as r`, ['  Year 10 set 1 ']);
check(c1.ok && /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(c1.join_code) && c1.name === 'Year 10 set 1', 'create_class ' + JSON.stringify(c1));
check(!(await rpc(T, `select public.create_class('') as r`)).ok, 'empty class name accepted');
check(await fails_(T, `insert into public.classes (owner, name, join_code) values ($1, 'x', 'ABCDEF')`, [T]), 'direct insert into classes allowed');
check(await fails_(T, `update public.classes set join_code = 'ABCDEF' where id = $1`, [c1.id]), 'owner can change join_code directly');
check(await fails_(T, `update public.classes set owner = $2 where id = $1`, [c1.id, X]), 'owner can give the class away');
await as(T, `update public.classes set name = 'Year 10 Set 1' where id = $1`, [c1.id]);
check((await as(T, 'select name from public.classes where id = $1', [c1.id])).rows[0].name === 'Year 10 Set 1', 'owner rename');

/* 3. limit of 10 active classes */
for (let i = 0; i < 9; i++) await rpc(T2, `select public.create_class($1) as r`, ['C' + i]);
check((await rpc(T2, `select public.create_class('C9') as r`)).ok, '10th class refused');
const over = await rpc(T2, `select public.create_class('C10') as r`);
check(!over.ok && /at most 10/.test(over.error), '11th class allowed');

/* 4. assignments by the owner only */
await as(T, `insert into public.class_assignments (class_id, kind, ref, due_date) values ($1, 'unit', 'L4-GE1', '2026-12-01'), ($1, 'check', '3', null)`, [c1.id]);
check(await fails_(X, `insert into public.class_assignments (class_id, kind, ref) values ($1, 'unit', 'L1-NT1')`, [c1.id]), 'stranger adds an assignment');
check(await fails_(T, `insert into public.class_assignments (class_id, kind, ref) values ($1, 'unit', 'L9-GE1')`, [c1.id], /check constraint|violates/i), 'bad unit ref accepted');
check(await fails_(T, `insert into public.class_assignments (class_id, kind, ref) values ($1, 'unit', 'L4-GE1')`, [c1.id], /duplicate|unique/i), 'same unit set twice');
check((await as(X, 'select * from public.class_assignments where class_id = $1', [c1.id])).rows.length === 0, 'stranger reads assignments');

/* 5. joining */
check(!(await rpc(S1, `select public.join_class($1, 'Amy') as r`, ['ZZZZZZ'])).ok || false, 'wrong code accepted');
const j1 = await rpc(S1, `select public.join_class($1, $2) as r`, [c1.join_code.toLowerCase().slice(0, 3) + '-' + c1.join_code.slice(3).toLowerCase(), '  Amy  B ']);
check(j1.ok && j1.name === 'Year 10 Set 1', 'join with lower case and hyphen ' + JSON.stringify(j1));
check((await as(S1, 'select display_name from public.class_members')).rows[0].display_name === 'Amy B', 'name trimmed');
check((await rpc(S2, `select public.join_class($1, '<b>') as r`, [c1.join_code])).ok === false, 'name with < accepted');
check((await rpc(S2, `select public.join_class($1, 'Ben') as r`, [c1.join_code])).ok, 'second student join');
const again = await rpc(S1, `select public.join_class($1, 'Amy') as r`, [c1.join_code]);
check(again.ok && again.already, 'rejoin is idempotent');
check(await fails_(S1, `insert into public.class_members (class_id, user_id, display_name) values ($1, $2, 'Bob')`, [c1.id, X]), 'direct insert into class_members');

/* 6. what a student can see */
check((await as(S1, 'select * from public.class_members')).rows.length === 1, 'student sees classmates');
check((await as(S1, 'select * from public.classes')).rows.length === 1, 'student sees their class');
check((await as(S1, 'select * from public.classes where owner = $1', [T2])).rows.length === 0, 'student sees other classes');
check((await as(S1, 'select * from public.class_assignments')).rows.length === 2, 'student sees the assignments');
check(await fails_(S1, `insert into public.class_assignments (class_id, kind, ref) values ($1, 'unit', 'L1-NT1')`, [c1.id]), 'student adds an assignment');
check((await as(S1, `delete from public.class_assignments returning id`)).rows.length === 0, 'student deletes an assignment');
check(await fails_(S1, `update public.classes set name = 'hacked' where id = $1`, [c1.id]) || (await as(T, 'select name from public.classes where id = $1', [c1.id])).rows[0].name === 'Year 10 Set 1', 'student renames class');
check(await fails_(S1, `select * from public.class_progress($1)`, [c1.id]), 'student reads class progress');
check(await fails_(S1, 'select * from public.class_join_attempts'), 'student reads join attempts');
await as(S1, `update public.class_members set display_name = 'Amy' where class_id = $1`, [c1.id]);
check((await as(S1, 'select display_name from public.class_members')).rows[0].display_name === 'Amy', 'student renames self');
check(await fails_(S1, `update public.class_members set class_id = $2 where class_id = $1`, [c1.id, randomUUID()]), 'student moves membership');
check((await as(S1, `update public.class_members set display_name = 'x' where user_id = $1 returning 1`, [S2])).rows.length === 0, 'student renames classmate');

/* 7. progress as the teacher sees it */
await as(S1, `insert into public.progress (user_id, data) values ($1, $2::jsonb)`, [S1, JSON.stringify({
  kv_path: { level: 4, u: { 'L4-GE1': { done: 1731500000000, ps: {}, lad: {} }, 'L4-X1': { done: 1731500000001 }, 'L4-NT1': { read: 1731500000000, ps: {}, lad: {} }, 'evil': { done: 1 } } },
  kv_diag: { 3: { score: 6, t: 1731500000000, by: { NT: 2, AL: 1, CO: 2, GE: 1, XX: 9 } }, 9: { score: 8 } },
  hu_scores: [{ secret: true }] })]);
check(await fails_(T, 'select * from public.progress where user_id = $1', [S1]) || (await as(T, 'select * from public.progress where user_id = $1', [S1])).rows.length === 0, 'teacher reads raw progress');
const pr = (await as(T, 'select * from public.class_progress($1)', [c1.id])).rows;
check(pr.length === 2 && pr[0].display_name === 'Amy' && pr[1].display_name === 'Ben', 'progress rows ' + JSON.stringify(pr.map(r => r.display_name)));
check(JSON.stringify(pr[0].units) === '["L4-GE1","L4-X1"]' && JSON.stringify(pr[0].started) === '["L4-NT1"]', 'units ' + JSON.stringify(pr[0]));
check(JSON.stringify(pr[0].checks) === JSON.stringify({ 3: { t: 1731500000000, by: { AL: 1, CO: 2, GE: 1, NT: 2 }, score: 6 } }), 'checks ' + JSON.stringify(pr[0].checks));
check(pr[0].last_active && !pr[1].last_active && pr[1].units.length === 0, 'last active / empty member');
check(!JSON.stringify(pr).includes('@x') && !JSON.stringify(pr).includes('secret'), 'progress leaks email or other data');
check(await fails_(T2, 'select * from public.class_progress($1)', [c1.id]), 'another teacher reads progress');
check(await fails_(null, 'select * from public.class_progress($1)', [c1.id]), 'anon reads progress');

/* 8. leaving removes access */
await as(S2, `delete from public.class_members where class_id = $1`, [c1.id]);
check((await as(T, 'select * from public.class_progress($1)', [c1.id])).rows.length === 1, 'left student still visible');
check((await as(S2, 'select * from public.class_assignments')).rows.length === 0, 'left student still sees assignments');
/* teacher removes a member */
check((await rpc(T, `select public.remove_class_member($1, $2) as r`, [c1.id, S1])).removed === 1, 'teacher removes member');
check(!(await rpc(T2, `select public.remove_class_member($1, $2) as r`, [c1.id, S1])).ok, 'other teacher removes member');

/* 9. archived classes cannot be joined; a new code works and the old one does not */
const nc = await rpc(T, `select public.new_class_code($1) as r`, [c1.id]);
check(nc.ok && nc.join_code !== c1.join_code, 'new code');
check(!(await rpc(X, `select public.join_class($1, 'Xa') as r`, [c1.join_code])).ok, 'old code still works');
check((await rpc(X, `select public.join_class($1, 'Xa') as r`, [nc.join_code])).ok, 'new code fails');
await as(T, 'update public.classes set archived = true where id = $1', [c1.id]);
check(!(await rpc(S2, `select public.join_class($1, 'Ben') as r`, [nc.join_code])).ok, 'archived class joinable');

/* 10. rate limit on wrong codes */
let last;
for (let i = 0; i < 11; i++) last = await rpc(S2, `select public.join_class('QQQQQQ', 'Ben') as r`);
check(!last.ok && /Too many/.test(last.error), 'no rate limit: ' + JSON.stringify(last));

/* 11. member cap of 60 */
const c3 = await rpc(T, `select public.create_class('Big') as r`);
for (let i = 0; i < 60; i++) { const u = randomUUID(); await db.query('insert into auth.users (id) values ($1)', [u]); const r = await rpc(u, `select public.join_class($1, $2) as r`, [c3.join_code, 'S' + i]); if (!r.ok) { check(false, 'join ' + i + ' ' + r.error); break; } }
const full = await rpc(S1, `select public.join_class($1, 'Late') as r`, [c3.join_code]);
check(!full.ok && /full/.test(full.error), 'member cap ' + JSON.stringify(full));

/* 12. deleting a class removes members and assignments */
await as(T, 'delete from public.classes where id = $1', [c1.id]);
check((await db.query('select count(*)::int as n from public.class_assignments where class_id = $1', [c1.id])).rows[0].n === 0, 'assignments survive class deletion');

console.log(fails ? `${fails} failed, ${passes} passed` : `All ${passes} checks passed.`);
process.exit(fails ? 1 : 0);
