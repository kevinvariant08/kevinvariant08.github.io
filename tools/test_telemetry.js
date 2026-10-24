/* node tools/test_telemetry.js : runs telemetry.js in a fake browser and checks its privacy promises. */
var fs = require('fs'), path = require('path'), vm = require('vm'), webcrypto = require('crypto').webcrypto;
var SRC = fs.readFileSync(path.join(__dirname, '..', 'telemetry.js'), 'utf8'), fails = 0;
function check(cond, msg) { if (!cond) { fails++; console.log('FAIL', msg); } }

function browser(opts) {
  opts = opts || {};
  var store = {}, calls = [], timers = [], nodes = [];
  var reply = opts.reply || function () { return { status: 200, body: { ok: true, kept: 1 } }; };
  function el(tag) {
    var e = { tag: tag, attrs: {}, children: [], listeners: {}, innerHTML: '', textContent: '',
      setAttribute: function (k, v) { this.attrs[k] = v; }, getAttribute: function (k) { return this.attrs[k] || null; },
      addEventListener: function (t, f) { this.listeners[t] = f; }, appendChild: function (c) { this.children.push(c); nodes.push(c); },
      remove: function () { var i = nodes.indexOf(this); if (i >= 0) nodes.splice(i, 1); } };
    return e;
  }
  var document = { body: el('body'), head: el('head'), createElement: el,
    getElementById: function (id) { return nodes.filter(function (n) { return n.id === id; })[0] || null; } };
  var window = {
    HU_AUTH_CONFIG: { url: 'https://example.supabase.co/', anonKey: 'sb_publishable_test' },
    HU_AUTH: opts.signedIn ? { client: {}, user: function () { return { id: 'real-user-id' }; }, session: { access_token: 'USER-JWT' } } : undefined,
    addEventListener: function () {}
  };
  var ctx = {
    window: window, document: document, crypto: webcrypto, JSON: JSON, Math: Math, Date: Date, Promise: Promise,
    String: String, Array: Array, Uint8Array: Uint8Array,
    localStorage: { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); } },
    setTimeout: function (f, ms) { timers.push({ f: f, ms: ms }); return timers.length; },
    clearTimeout: function (id) { if (timers[id - 1]) timers[id - 1].cleared = true; },
    fetch: function (url, init) {
      calls.push({ url: url, init: init, body: JSON.parse(init.body) });
      var r = reply(calls.length, JSON.parse(init.body));
      return Promise.resolve({ ok: r.status < 300, status: r.status, json: function () { return Promise.resolve(r.body); } });
    }
  };
  vm.runInNewContext(SRC, ctx);
  var T = window.KV_TELEMETRY;
  return { T: T, store: store, calls: calls, timers: timers, nodes: nodes, out: function () { return JSON.parse(store.kv_outbox || '[]'); } };
}
function entry(id, extra) { var e = { t: Date.now(), id: id, paper: id.split('-')[0], correct: true, chosen: 'B', secs: 31.6, mode: 'smart', tags: ['inv'], conf: 3 }; for (var k in extra) e[k] = extra[k]; return e; }

(async function () {
  /* 1. no choice yet: nothing stored or sent, the notice appears */
  var b = browser();
  b.T.record(entry('B1-1'));
  await b.T.flush();
  check(b.out().length === 0 && b.calls.length === 0, 'answer queued or sent before any choice');
  check(b.nodes.some(function (n) { return n.className === 'kv-share'; }), 'notice not shown before the first shared answer');

  /* 2. "Keep on this device": never queued, never sent */
  b.T.setChoice('no');
  b.T.record(entry('B1-2'));
  await b.T.flush();
  check(b.out().length === 0 && b.calls.length === 0, 'answer shared after "keep on this device"');
  check(!b.nodes.some(function (n) { return n.className === 'kv-share'; }), 'notice still shown after a choice');

  /* 3. "Share anonymously": only answers made after the choice, with exactly the six fields */
  b = browser({ signedIn: true });
  var before = entry('B1-3', { t: Date.now() - 60000 });
  b.T.setChoice('yes');
  b.T.record(before);
  b.T.record(entry('B1-4'));
  b.T.record(entry('Z9-9'));                      // not a question id
  b.T.record(entry('B1-5', { chosen: null }));   // skipped question
  b.T.record(entry('B1-6', { chosen: 'B; drop table' }));
  check(b.out().length === 1 && b.out()[0].q === 'B1-4', 'outbox should hold only B1-4, has ' + JSON.stringify(b.out().map(function (r) { return r.q; })));
  await b.T.flush();
  check(b.calls.length === 1, 'expected one request');
  var c = b.calls[0];
  check(c.url === 'https://example.supabase.co/rest/v1/rpc/hu_log_attempts', 'wrong endpoint ' + c.url);
  check(Object.keys(c.init.headers).sort().join() === 'Content-Type,apikey', 'unexpected headers ' + Object.keys(c.init.headers));
  check(c.init.credentials === 'omit', 'cookies or credentials not omitted');
  check(JSON.stringify(c).indexOf('USER-JWT') < 0 && JSON.stringify(c).indexOf('real-user-id') < 0, 'request carries the signed-in user');
  check(Object.keys(c.body).sort().join() === 'p_anon,p_rows', 'unexpected body keys');
  check(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.body.p_anon), 'anonymous id is not a random UUID');
  var r = c.body.p_rows[0];
  check(Object.keys(r).sort().join() === 'c,m,ok,q,s,t', 'row has unexpected fields: ' + Object.keys(r));
  check(r.s === 32 && r.c === 'B' && r.ok === true && r.m === 'smart', 'row values wrong ' + JSON.stringify(r));
  check(b.out().length === 0, 'outbox not cleared after success');

  /* 4. batches of at most 50, oldest first */
  b = browser();
  b.T.setChoice('yes');
  for (var i = 0; i < 120; i++) b.T.record(entry('C' + (1 + i % 2) + '-' + (1 + i % 20), { t: Date.now() + i }));
  while (b.out().length) await b.T.flush();
  check(b.calls.length === 3 && b.calls.every(function (x) { return x.body.p_rows.length <= 50; }), 'batching: ' + b.calls.map(function (x) { return x.body.p_rows.length; }));

  /* 5. server down: kept and retried; rejected outright: dropped */
  b = browser({ reply: function (n) { return n === 1 ? { status: 503, body: {} } : { status: 200, body: { ok: true } }; } });
  b.T.setChoice('yes'); b.T.record(entry('D1-1'));
  await b.T.flush();
  check(b.out().length === 1, 'answer lost when the server was down');
  check(b.timers.some(function (t) { return t.ms >= 30000; }), 'no backoff retry scheduled');
  await b.T.flush();
  check(b.out().length === 0, 'retry did not send');
  b = browser({ reply: function () { return { status: 400, body: {} }; } });
  b.T.setChoice('yes'); b.T.record(entry('D1-2'));
  await b.T.flush();
  check(b.out().length === 0, 'rejected batch blocks the queue');
  b = browser({ reply: function () { return { status: 200, body: { ok: false, retry: true } }; } });
  b.T.setChoice('yes'); b.T.record(entry('D1-3'));
  await b.T.flush();
  check(b.out().length === 1, 'rate-limited batch was dropped');

  /* 6. outbox is capped; switching to "keep on this device" clears it */
  b = browser({ reply: function () { return { status: 503, body: {} }; } });
  b.T.setChoice('yes');
  for (i = 0; i < 600; i++) b.T.record(entry('B2-' + (1 + i % 20), { t: Date.now() + i }));
  check(b.out().length === 500, 'outbox not capped at 500: ' + b.out().length);
  b.T.setChoice('no');
  check(b.out().length === 0, 'outbox kept after opting out');

  /* 7. forget: deletes on the server, then a fresh id */
  b = browser({ reply: function () { return { status: 200, body: { ok: true, deleted: 4 } }; } });
  b.T.setChoice('yes');
  var oldId = b.T.choice().id;
  var res = await b.T.forget();
  check(res.deleted === 4 && b.calls[0].url.slice(-18) === 'hu_forget_attempts' && b.calls[0].body.p_anon === oldId, 'forget request wrong');
  check(b.T.choice().id !== oldId && b.T.choice().choice === 'yes', 'id not renewed after forget');

  console.log(fails ? fails + ' FAILED' : 'all telemetry checks passed');
  process.exit(fails ? 1 : 0);
})();
