/* node tools/test_logic_gym.js : checks the logic gym's answers independently of how it generated them. */
var L = require('../logic-gym.js'), fails = 0;
function check(cond, msg) { if (!cond) { fails++; if (fails < 20) console.log('FAIL', msg); } }

/* 1. soundness: the -120..120 check agrees with a much wider check for every ordered pair */
var W = 2000;
function wide(A, B) { for (var n = -W; n <= W; n++) if (A.ok(n) && !B.ok(n)) return false; return true; }
L.predicates.forEach(function (A) { L.predicates.forEach(function (B) {
  if (A === B) return;
  check((L.counter(A, B) === null) === wide(A, B), 'range check disagrees for ' + A.id + ' => ' + B.id);
}); });

/* 2. every relation class is populated */
var P = L.pairs();
['both', 'suff', 'nec', 'neither', 'trap'].forEach(function (k) { check(P[k].length > 0, 'no pairs for ' + k); console.log(k, P[k].length); });

/* 3. generated questions: answers are right, options are distinct, explanations exist */
var counts = {};
for (var seed = 1; seed <= 3000; seed++) {
  var q = L.generate(null, seed);
  counts[q.type] = (counts[q.type] || 0) + 1;
  check(q.explain && q.explain.length > 20, 'no explanation, seed ' + seed);
  if (q.opts) {
    check(q.ans >= 0 && q.ans < q.opts.length, 'answer index out of range, seed ' + seed);
    check(new Set(q.opts).size === q.opts.length, 'duplicate options, seed ' + seed);
    check(q.opts.length >= 4, 'too few options, seed ' + seed);
  }
  if (q.type === 'counter') {
    if (q.isTrue) { check(L.markCounter(q, 'true').ok, 'true statement not accepted, seed ' + seed); }
    else {
      check(L.markCounter(q, String(q.example)).ok, 'own counterexample rejected, seed ' + seed);
      check(!L.markCounter(q, 'true').ok, 'false statement accepted as true, seed ' + seed);
      // any other counterexample in range must also be accepted
      for (var n = -30; n <= 30; n++) if (q.A.ok(n) && !q.B.ok(n)) check(L.markCounter(q, String(n)).ok, 'valid counterexample ' + n + ' rejected');
    }
    check(!L.markCounter(q, 'abc').ok && !L.markCounter(q, '1.5').ok, 'junk accepted');
  }
}
console.log('types', JSON.stringify(counts));
/* 4. N&S answers re-derived from scratch */
var KEY = ['nec', 'suff', 'both', 'neither'];
for (var s = 1; s <= 2000; s++) {
  var g = L.generate('ns', s), m = g.prompt.match(/A: (.*?)&emsp; B: (.*?)<\/p>/);
  var A = L.predicates.filter(function (p) { return p.t === m[1]; })[0], B = L.predicates.filter(function (p) { return p.t === m[2]; })[0];
  check(A && B, 'could not find conditions in prompt, seed ' + s);
  if (A && B) check(KEY[g.ans] === L.rel(A, B), 'N&S answer wrong, seed ' + s);
}
console.log(fails ? fails + ' failures' : 'all checks passed');
process.exit(fails ? 1 : 0);
