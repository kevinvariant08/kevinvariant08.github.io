/* node tools/test_item_bank.js : checks data/item_bank.json against the site's own data, and that it carries no answers. */
var fs = require('fs'), path = require('path'), vm = require('vm');
var root = path.join(__dirname, '..'), fails = 0;
function check(cond, msg) { if (!cond) { fails++; if (fails < 20) console.log('FAIL', msg); } }
function load(file) { var w = {}; vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), { window: w }); return w; }

var bank = JSON.parse(fs.readFileSync(path.join(root, 'data', 'item_bank.json'), 'utf8'));
var Q = load('questions.js').HU_QUESTIONS;
var META = load('locks.js').HU_LOCKS.meta;
var byId = {}; bank.items.forEach(function (it) { byId[it.id] = it; });
var topicKeys = bank.topics.map(function (t) { return t.key; });

/* 1. every question on the site is in the bank exactly once, with the right lock flag */
check(Object.keys(byId).length === bank.items.length, 'duplicate ids');
Q.forEach(function (q) {
  var it = byId[q.id];
  check(it, q.id + ' missing from the bank');
  if (!it) return;
  check(it.locked === false && !META[q.paper], q.id + ' is free on the site but not in the bank');
  check(it.options === q.opts.length, q.id + ' option count differs');
  check(it.rating === q.rating, q.id + ' rating differs');
});
Object.keys(META).forEach(function (p) {
  var n = bank.items.filter(function (it) { return it.set + it.paper === p; }).length;
  check(n === META[p].questions, p + ': ' + n + ' items, locks.js says ' + META[p].questions);
});
bank.items.forEach(function (it) { check(it.locked === !!META[it.set + it.paper], it.id + ' lock flag disagrees with locks.js'); });
var free = bank.items.filter(function (it) { return !it.locked; });
check(free.length === 120 && free.every(function (it) { return 'BCD'.indexOf(it.set) >= 0; }), 'free pool should be Sets B to D (120)');

/* 2. no answers or content: only whitelisted keys, no long strings, no answer text from questions.js */
var ITEM_KEYS = ['id', 'set', 'paper', 'locked', 'options', 'rating', 'topics', 'rating_used', 'prior'];
var PRIOR_KEYS = ['b', 'b_sd', 'a', 'a_log_sd', 'c'];
bank.items.forEach(function (it) {
  Object.keys(it).forEach(function (k) { check(ITEM_KEYS.indexOf(k) >= 0, it.id + ' has unexpected key ' + k); });
  Object.keys(it.prior).forEach(function (k) { check(PRIOR_KEYS.indexOf(k) >= 0, it.id + ' prior has unexpected key ' + k); });
});
var raw = fs.readFileSync(path.join(root, 'data', 'item_bank.json'), 'utf8');
check(!/"(ans|answer|answers|sol|solution|q|opts|text)"\s*:/.test(raw), 'bank contains an answer or content field');
Q.forEach(function (q) {
  q.opts.concat([q.q, q.sol]).forEach(function (s) { if (s.length > 12) check(raw.indexOf(s) < 0, q.id + ' text appears in the bank'); });
});

/* 3. topics: free items have 1 or 2 valid topics, locked items none (they stay private) */
bank.items.forEach(function (it) {
  if (it.locked) { check(!('topics' in it), it.id + ' is locked but has public topics'); return; }
  check(Array.isArray(it.topics) && it.topics.length >= 1 && it.topics.length <= 2, it.id + ' needs 1 or 2 topics');
  (it.topics || []).forEach(function (t) { check(topicKeys.indexOf(t) >= 0, it.id + ' unknown topic ' + t); });
});

/* 4. priors follow the boundaries model */
var m = bank.model;
bank.items.forEach(function (it) {
  var p = it.prior;
  check(Math.abs(p.b - (it.rating_used - m.theta_to_tmua.mean) / m.theta_to_tmua.sd) < 0.001, it.id + ' prior b is off');
  check(Math.abs(p.a - m.slope_per_tmua_point * m.theta_to_tmua.sd) < 0.001, it.id + ' prior a is off');
  check(it.options === null ? p.c === null : Math.abs(p.c - 1 / it.options) < 0.0001, it.id + ' guessing floor is off');
});

var cover = {}; free.forEach(function (it) { (it.topics || []).forEach(function (t, i) { cover[t] = (cover[t] || 0) + (i === 0 ? 1 : 0); }); });
console.log('items', bank.items.length, '| free', free.length, '| primary topics in free pool', JSON.stringify(cover));
console.log(fails ? fails + ' FAILED' : 'all item bank checks passed');
process.exit(fails ? 1 : 0);
