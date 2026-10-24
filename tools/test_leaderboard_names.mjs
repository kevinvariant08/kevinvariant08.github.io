/* Runs leaderboard-names.sql on an in-process PostgreSQL and checks that no leaderboard name shows an email name,
   and that the SQL and rewards.js agree on the default "Player NNNN".
   Once:  cd tools && npm install        Then:  node tools/test_leaderboard_names.mjs */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';

const sql = readFileSync(new URL('../leaderboard-names.sql', import.meta.url), 'utf8');
let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } };

/* the browser's rule, taken from rewards.js itself */
const src = readFileSync(new URL('../rewards.js', import.meta.url), 'utf8');
const grab = name => { const i = src.indexOf('function ' + name + '('); return src.slice(i, src.indexOf('\n  function ', i)); };
const ctx = { R: {} }; vm.runInNewContext('function state(){ return R; }\n' + ['defaultName', 'emailish', 'displayName'].map(grab).join('\n'), ctx);

/* the browser never shows an email name, even one saved earlier as the chosen leaderboard name */
const bu = { id: '0000270f-0000-4000-8000-000000000000', email: 'jane.doe@example.com', user_metadata: {} };
const shown = (lbName, meta) => { ctx.R = { lbName }; return ctx.displayName(Object.assign({}, bu, { user_metadata: meta || {} })); };
check(shown(undefined) === 'Player 9999', 'default name in the browser: ' + shown(undefined));
check(shown('jane.doe') === 'Player 9999', 'saved email name shown: ' + shown('jane.doe'));
check(shown('Jane.Doe ') === 'Player 9999', 'saved email name (case) shown');
check(shown('a@b') === 'Player 9999', 'name with @ shown');
check(shown('jane.doe', { display_name: 'Jane' }) === 'Jane', 'account display name not used');
check(shown('Mathlete', { display_name: 'Jane' }) === 'Mathlete', 'chosen leaderboard name not used');

const db = new PGlite();
await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text);
  create table public.leaderboard (user_id uuid primary key, name text, xp int default 0);`);

const users = [
  ['jane.doe', 'jane.doe@example.com'],          // email name: renamed
  ['JANE2', 'jane2@example.com'],               // same, different case: renamed
  ['x@y.com', 'other@example.com'],              // contains @: renamed
  ['', 'blank@example.com'],                     // empty: renamed
  ['abcdefghijklmnopqrstuvwx', 'abcdefghijklmnopqrstuvwxyz@example.com'], // 24-char cut of a long email name: renamed
  ['Mathlete', 'someone@example.com'],           // chosen name: kept
].map(([name, email]) => ({ id: randomUUID(), name, email }));
for (const u of users) {
  await db.query('insert into auth.users values ($1, $2)', [u.id, u.email]);
  await db.query('insert into public.leaderboard (user_id, name) values ($1, $2)', [u.id, u.name]);
}
await db.exec(sql);
await db.exec(sql);                                  // safe to run again

const name = async id => (await db.query('select name from public.leaderboard where user_id = $1', [id])).rows[0].name;
for (const u of users.slice(0, 5)) {
  const n = await name(u.id);
  check(/^Player \d{4}$/.test(n), `row for ${u.email} not renamed`);
  check(n === ctx.defaultName({ id: u.id }), `SQL and rewards.js disagree for ${u.id}: ${n} vs ${ctx.defaultName({ id: u.id })}`);
}
check(await name(users[5].id) === 'Mathlete', 'chosen name changed');

/* the trigger catches an old client re-sending the email name */
await db.query('update public.leaderboard set name = $2 where user_id = $1', [users[0].id, 'jane.doe']);
check(/^Player \d{4}$/.test(await name(users[0].id)), 'trigger let an email name back in on update');
const nu = randomUUID(); await db.query(`insert into auth.users values ($1, 'new.person@example.com')`, [nu]);
await db.query(`insert into public.leaderboard (user_id, name) values ($1, 'New.Person')`, [nu]);
check(/^Player \d{4}$/.test(await name(nu)), 'trigger let an email name in on insert');

/* the browser cannot call the email-checking helper */
await db.exec('set role anon');
try { await db.query(`select public.hu_name_is_emailish('a', gen_random_uuid())`); check(false, 'anon can call hu_name_is_emailish'); }
catch (e) { check(/permission denied/i.test(e.message), 'unexpected error: ' + e.message); }
await db.exec('reset role');

/* edge ids: leading zeros and the largest prefix */
for (const id of ['00000000-0000-4000-8000-000000000000', 'ffffffff-ffff-4fff-bfff-ffffffffffff', '0000270f-0000-4000-8000-000000000000']) {
  const s = (await db.query('select public.hu_player_name($1) as n', [id])).rows[0].n;
  check(s === ctx.defaultName({ id }), `edge id ${id}: ${s} vs ${ctx.defaultName({ id })}`);
}
console.log(fails ? fails + ' failure(s)' : 'leaderboard-names.sql: all checks passed');
process.exit(fails ? 1 : 0);
