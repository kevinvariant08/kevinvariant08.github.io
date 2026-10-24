/* node tools/test_smart.js : checks the Smart Practice engine, above all that locked questions never reach a visitor
   who has not unlocked them. */
var fs = require('fs'), path = require('path'), vm = require('vm');
var root = path.join(__dirname, '..'), fails = 0;
function check(cond, msg) { if (!cond) { fails++; if (fails < 25) console.log('FAIL', msg); } }
function load(file) { var w = {}; vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), { window: w }); return w; }
var S = require(path.join(root, 'smart.js'));
var bank = JSON.parse(fs.readFileSync(path.join(root, 'data', 'item_bank.json'), 'utf8'));
var params = JSON.parse(fs.readFileSync(path.join(root, 'data', 'item_params.json'), 'utf8'));
var FREE = load('questions.js').HU_QUESTIONS, META = load('locks.js').HU_LOCKS.meta;
function rng(seed) {                    /* mulberry32: well mixed even for small seeds */
  var s = seed >>> 0;
  return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* Fake locked questions (no real content) for papers E to L, as the bucket would return them. */
var FAKE_LOCKED = [];
Object.keys(META).forEach(function (p) {
  for (var n = 1; n <= 20; n++) FAKE_LOCKED.push({ id: p + '-' + n, paper: p, n: n, q: 'fake', opts: ['1', '2', '3', '4', '5', '6'], ans: 'A', sol: 'fake', tags: ['mod'], rating: 7 });
});
function allowedFor(scopes) { return function (p) { return !META[p] || scopes.indexOf('*') >= 0 || scopes.indexOf(p) >= 0; }; }

/* 1. what is shipped to everyone has no locked questions */
check(FREE.every(function (q) { return !META[q.paper]; }), 'questions.js contains a locked paper');
check(FREE.length === 120, 'free pool should be 120 questions, is ' + FREE.length);

/* 2. pool: locked questions excluded unless unlocked, even if they were (wrongly) passed in */
var all = FREE.concat(FAKE_LOCKED);
var anon = S.buildPool(all, bank, params, { allowed: allowedFor([]), paper: 'mix' });
check(anon.length === 120 && anon.every(function (it) { return !META[it.paper]; }), 'signed-out pool has locked items: ' + anon.length);
var someone = S.buildPool(all, bank, params, { allowed: allowedFor(['I1', 'K2']), paper: 'mix' });
check(someone.length === 160 && someone.every(function (it) { return !META[it.paper] || it.paper === 'I1' || it.paper === 'K2'; }), 'unlocked pool wrong: ' + someone.length);

/* 3. many simulated sessions never serve a question outside the visitor's pool */
for (var s = 0; s < 200; s++) {
  var r = rng(s), pool = s % 2 ? anon : someone, st = { theta: 0.5, answered: [], recent: {} }, ok = true;
  for (var k = 0; k < 25; k++) {
    var c = S.choose(pool, st, r); if (!c) break;
    if (META[c.item.paper] && !(s % 2 === 0 && (c.item.paper === 'I1' || c.item.paper === 'K2'))) ok = false;
    st.answered.push({ item: c.item, y: r() < S.prob(st.theta, c.item) });
    st.theta = S.eap(st.answered, 0, 1).mean;
  }
  check(ok, 'session ' + s + ' served a locked question it should not');
}

/* 4. the page's loader only asks the server for papers the visitor has unlocked, and keeps only that paper */
var asked = [];
var fakeLocks = { meta: META, configured: function () { return true; },
  scopes: function () { return Promise.resolve(['J2']); },
  questions: function (p) { asked.push(p); return Promise.resolve(FAKE_LOCKED.filter(function (q) { return q.paper === p || q.paper === 'E1'; })); } };
var loaded = S.loadUnlocked(fakeLocks).then(function (qs) {
  check(asked.join() === 'J2', 'asked the server for ' + asked.join());
  check(qs.length === 20 && qs.every(function (q) { return q.paper === 'J2'; }), 'loader kept questions from another paper');
});
var signedOut = { meta: META, configured: function () { return true; }, scopes: function () { return Promise.resolve([]); },
  questions: function (p) { check(false, 'signed-out visitor asked for ' + p); return Promise.resolve([]); } };
var loaded2 = S.loadUnlocked(signedOut).then(function (qs) { check(qs.length === 0, 'signed-out loader returned questions'); });

/* 5. paper choice */
['1', '2'].forEach(function (p) {
  var pl = S.buildPool(all, bank, params, { allowed: allowedFor(['*']), paper: p });
  check(pl.length === 220 && pl.every(function (it) { return it.paper.charAt(1) === p; }), 'paper ' + p + ' pool wrong');
});

/* 6. EAP matches calibration/irt.py on the same 71-point grid */
var I = [{ a: 1.327, b: -0.5, c: 1 / 6 }, { a: 0.9, b: 0.3, c: 1 / 5 }, { a: 2.0, b: 1.2, c: 1 / 4 }, { a: 1.5, b: 2.0, c: 1 / 6 }];
[[[1, 1, 0, 0], 0, 1, 0.129363, 0.747044], [[1, 1, 1, 1], 0.5, 0.9, 1.459759, 0.778689], [[], 0, 1, 0, 0.997409]].forEach(function (t) {
  var e = S.eap(t[0].map(function (y, i) { return { item: I[i], y: y }; }), t[1], t[2]);
  check(Math.abs(e.mean - t[3]) < 1e-5 && Math.abs(e.sd - t[4]) < 1e-5, 'EAP differs from Python: ' + e.mean + ' ' + e.sd);
});
var e2 = S.eap([{ item: I[2], y: 0 }, { item: I[3], y: 0 }], 1, 1);
check(Math.abs(e2.mean - 0.358685) < 1e-5, 'EAP with prior mean 1 differs from Python');

/* 7. selection: most informative, topics rotate, easier wins after two misses, no repeats */
var st2 = { theta: 1.0, answered: [], recent: {} }, r2 = rng(99), topicsRun = [], repeats = {};
for (k = 0; k < 20; k++) {
  var ch = S.choose(anon, st2, r2);
  check(!repeats[ch.item.id], 'repeated ' + ch.item.id); repeats[ch.item.id] = 1;
  if (ch.why === 'informative' && st2.answered.length) {
    var prev = st2.answered[st2.answered.length - 1].item.topic;
    check(ch.item.topic !== prev, 'same topic twice running: ' + ch.item.topic);
  }
  topicsRun.push(ch.item.topic);
  st2.answered.push({ item: ch.item, y: k % 3 !== 2 });
}
check(new Set(topicsRun).size >= 6, 'only ' + new Set(topicsRun).size + ' topics in 20 questions');
/* a struggling student (every answer wrong) gets mostly easier questions; topics must still rotate */
for (var sd = 0; sd < 30; sd++) {
  var stw = { theta: 0.5, answered: [], recent: {} }, rw = rng(500 + sd), cnt = {}, prevT = null, twice = false;
  for (k = 0; k < 10; k++) {
    var cw = S.choose(anon, stw, rw); cnt[cw.item.topic] = (cnt[cw.item.topic] || 0) + 1;
    if (cw.item.topic === prevT) twice = true; prevT = cw.item.topic;
    stw.answered.push({ item: cw.item, y: false }); stw.theta = S.eap(stw.answered, 0.5, 1).mean;
  }
  var most = Math.max.apply(null, Object.keys(cnt).map(function (t) { return cnt[t]; }));
  check(most <= 4 && !twice, 'struggling student, seed ' + sd + ': ' + JSON.stringify(cnt) + (twice ? ' (same topic twice running)' : ''));
}
var st3 = { theta: 1.0, answered: [{ item: anon[0], y: false }, { item: anon[1], y: false }], recent: {} };
var easy = S.choose(anon, st3, rng(3));
var pEasy = S.prob(1.0, easy.item);
check(easy.why === 'easier' && pEasy >= 0.69, 'after two misses expected an easier question, got p=' + pEasy.toFixed(2));
var st4 = { theta: 0.3, answered: [], recent: {} };
var firstPicks = {}; for (k = 0; k < 40; k++) firstPicks[S.choose(anon, st4, rng(k)).item.id] = 1;
check(Object.keys(firstPicks).length >= 3, 'no exposure control: first question always the same');
var tiny = anon.slice(0, 3), st5 = { theta: 0, answered: [], recent: {} };
for (k = 0; k < 3; k++) st5.answered.push({ item: S.choose(tiny, st5, rng(k)).item, y: true });
check(S.choose(tiny, st5, rng(1)) === null, 'should stop when the pool is used up');

/* 8. summary: rough-estimate label, percentile basis, a suggested topic */
var sm = S.summary(st2.answered, S.eap(st2.answered, 0, 1), { fitted: false });
check(/Rough estimate/.test(sm.tmua.label) && /Not an official/.test(sm.tmua.label), 'TMUA label missing the caveat');
check(sm.percentileOf === 'TMUA candidates' && sm.percentile >= 0 && sm.percentile <= 100, 'percentile wrong');
check(sm.tmua.low <= sm.tmua.estimate && sm.tmua.estimate <= sm.tmua.high && sm.tmua.high <= 9, 'TMUA range wrong');
check(typeof sm.suggest === 'string' && sm.topics.length >= 3, 'no suggested topic');
check(S.summary(st2.answered, { mean: 0.8, sd: 0.4 }, { fitted: true, mean: 0.8, sd: 0.5 }).percentile === 50, 'site percentile wrong');

Promise.all([loaded, loaded2]).then(function () {
  console.log(fails ? fails + ' FAILED' : 'all Smart Practice engine checks passed');
  process.exit(fails ? 1 : 0);
});
