/* Runs attempts.sql on a real (in-process) PostgreSQL and checks what the browser's "anon" role can and cannot do.
   Once:  cd tools && npm install        Then:  node tools/test_attempts_sql.mjs */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

const sql = readFileSync(new URL('../attempts.sql', import.meta.url), 'utf8');
let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } };

/* 0. privacy by construction: the SQL never looks at who is signed in */
check(!/auth\.|request\.|current_setting/i.test(sql.replace(/--.*$/gm, '')), 'attempts.sql must not read auth.uid(), request headers or settings');

const db = new PGlite({ extensions: { pgcrypto } });
await db.exec(`create role anon nologin; create role authenticated nologin; create schema extensions;
  grant usage on schema public to anon, authenticated; grant usage on schema extensions to anon, authenticated;`);
await db.exec(sql);
await db.exec(sql);                                  // safe to run again
const KEY = 'test-calibration-key-0123456789';
await db.query('insert into public.calibration_keys (key_hash, note) values ($1, $2)', [createHash('sha256').update(KEY).digest('hex'), 'test']);

async function asAnon(q, params) {
  await db.exec('set role anon');
  try { return await db.query(q, params); } finally { await db.exec('reset role'); }
}
async function denied(q) { try { await asAnon(q); return false; } catch (e) { return /permission denied/i.test(e.message); } }
const log = async (anon, rows) => (await asAnon('select public.hu_log_attempts($1, $2::jsonb) as r', [anon, JSON.stringify(rows)])).rows[0].r;
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const row = (q, extra = {}) => Object.assign({ q, c: 'C', ok: true, s: 42, t: iso(now - 60000), m: 'smart' }, extra);

/* 1. the browser cannot touch the tables directly */
check(await denied('select * from public.attempts'), 'anon can read attempts');
check(await denied(`insert into public.attempts (anon_id, question_id, chosen, correct, secs, answered_at, mode) values (gen_random_uuid(), 'B1-1', 'A', true, 5, now(), 'smart')`), 'anon can insert directly');
check(await denied('delete from public.attempts'), 'anon can delete directly');
check(await denied('select * from public.calibration_keys'), 'anon can read calibration keys');

/* 2. a normal batch is stored, a repeated batch is not stored twice */
const A = randomUUID();
const batch = [row('B1-1'), row('C2-20', { c: 'A', ok: false, s: 3, t: iso(now - 120000) }), row('L2-7', { m: 'paper' })];
let r = await log(A, batch);
check(r.ok && r.kept === 3 && r.skipped === 0, 'valid batch: ' + JSON.stringify(r));
r = await log(A, batch);
check(r.ok && r.kept === 0 && r.skipped === 3, 'duplicate batch: ' + JSON.stringify(r));

/* 3. bad rows are skipped one by one, good rows in the same batch still count */
r = await log(A, [row('Z9-1'), row('B1-21'), row('B1-2', { c: 'Z' }), row('B1-3', { s: -1 }), row('B1-4', { m: 'Bad Mode' }),
  row('B1-5', { t: iso(now - 40 * 86400000) }), row('B1-6', { t: null }), row('B1-7', { ok: 'maybe' }), row('B1-8')]);
check(r.ok && r.kept === 1 && r.skipped === 8, 'invalid rows: ' + JSON.stringify(r));

/* 4. at most 3 stored answers per question per id */
r = await log(A, [1, 2, 3, 4, 5].map(i => row('D1-9', { t: iso(now - i * 1000) })));
check(r.kept === 3 && r.skipped === 2, 'per-question cap: ' + JSON.stringify(r));

/* 5. batch size and hourly rate limit */
r = await log(A, Array.from({ length: 51 }, (_, i) => row('B2-' + (1 + i % 20), { t: iso(now - i * 1000) })));
check(!r.ok, 'more than 50 rows accepted');
const B = randomUUID();
await db.query(`insert into public.attempts (anon_id, question_id, chosen, correct, secs, answered_at, mode)
  select $1, 'C1-' || (1 + g % 20), 'A', true, 10, now() - (g || ' seconds')::interval, 'smart' from generate_series(1, 299) g`, [B]);
r = await log(B, [row('D2-1'), row('D2-2')]);
check(!r.ok && r.retry === true, 'hourly rate limit not applied: ' + JSON.stringify(r));

/* 6. export: needs the key, returns only the expected columns */
const exp = async (k, after = 0) => (await asAnon('select public.hu_export_attempts($1, $2, 1000) as r', [k, after])).rows[0].r;
check((await exp('wrong-key')) === null, 'export works with a wrong key');
check((await exp(null)) === null, 'export works with no key');
const rows = await exp(KEY);
check(Array.isArray(rows) && rows.length === 3 + 1 + 3 + 299, 'export row count ' + (rows && rows.length));
check(rows.every(x => Object.keys(x).sort().join() === 'anon_id,answered_at,chosen,correct,id,mode,question_id,secs'), 'export has unexpected columns: ' + Object.keys(rows[0]).sort().join());
check((await exp(KEY, rows[2].id)).length === rows.length - 3, 'export paging by id');

/* 7. forgetting deletes exactly one id's rows */
r = (await asAnon('select public.hu_forget_attempts($1) as r', [A])).rows[0].r;
check(r.deleted === 7, 'forget deleted ' + r.deleted);
check((await exp(KEY)).every(x => x.anon_id !== A) && (await exp(KEY)).length === 299, 'forget touched other ids');

console.log(fails ? fails + ' FAILED' : 'all attempts.sql checks passed');
process.exit(fails ? 1 : 0);
