/* Smart Practice engine: ability estimation and question choice. No page access here, so it can be tested in Node
   (tools/test_smart.js). The page (smart.html) builds the pool, asks this engine for the next question, and shows it.

   Model (same as calibration/irt.py): P(right | theta) = c + (1 - c) / (1 + exp(-a (theta - b))), c = 1 / options.
   theta = 0 is the median TMUA candidate and theta = 1 one candidate SD, so TMUA score ~ 4.5 + 1.951 theta. */
(function (root) {
  var GRID = []; for (var g = -35; g <= 35; g++) GRID.push(g / 10);          /* 71 points, -3.5 to 3.5 */
  var TMUA_MEAN = 4.5, TMUA_SD = 1.951;

  /* Topic for a question when the public bank has none (locked papers): from its first technique tag. */
  var TECH_TOPIC = { sym: 'algebra', vie: 'algebra', ineq: 'algebra', poly: 'algebra', bin: 'algebra', quad: 'algebra',
    tel: 'sequences-series', ser: 'sequences-series', two: 'probability-counting', pig: 'probability-counting', cnt: 'probability-counting',
    inv: 'number', mod: 'number', col: 'number', trg: 'trigonometry', arint: 'integration', fint: 'integration',
    root: 'functions-graphs', trans: 'functions-graphs', ext: 'logic-proof', game: 'logic-proof', log: 'logic-proof', prf: 'logic-proof',
    ns: 'logic-proof', circ: 'geometry', coord: 'geometry', exp: 'exponentials-logs', diff: 'differentiation' };

  function sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, x)))); }
  function prob(theta, it) { return it.c + (1 - it.c) * sigmoid(it.a * (theta - it.b)); }
  function info(theta, it) {
    var p = prob(theta, it), s = sigmoid(it.a * (theta - it.b)), dp = it.a * (1 - it.c) * s * (1 - s);
    return dp * dp / (p * (1 - p));
  }

  /* Expected a posteriori ability from answers [{item, y}], prior Normal(mu, sigma). Returns {mean, sd}. */
  function eap(answers, mu, sigma) {
    var lp = GRID.map(function (t) { return -0.5 * Math.pow((t - mu) / sigma, 2); });
    answers.forEach(function (r) {
      for (var g = 0; g < GRID.length; g++) { var p = prob(GRID[g], r.item); lp[g] += r.y ? Math.log(p) : Math.log(1 - p); }
    });
    var mx = Math.max.apply(null, lp), w = lp.map(function (x) { return Math.exp(x - mx); });
    var s = w.reduce(function (a, b) { return a + b; }, 0), m = 0, m2 = 0;
    for (var g = 0; g < GRID.length; g++) { var q = w[g] / s; m += q * GRID[g]; m2 += q * GRID[g] * GRID[g]; }
    return { mean: m, sd: Math.sqrt(Math.max(m2 - m * m, 0)) };
  }

  /* The pool: one entry per question the visitor may see. allowed(paper) is the lock rule; it is applied here even
     though the page only ever loads questions it is allowed to, so a bug elsewhere cannot leak a locked question. */
  function buildPool(questions, bank, params, opts) {
    var byBank = {}, out = [];
    (bank.items || []).forEach(function (it) { byBank[it.id] = it; });
    var P = (params && params.items) || {};
    questions.forEach(function (q) {
      if (!opts.allowed(q.paper)) return;
      if (opts.paper !== 'mix' && q.paper.charAt(1) !== opts.paper) return;
      var b = byBank[q.id]; if (!b) return;
      var k = q.opts.length, fit = P[q.id], pr = b.prior;
      var topic = (b.topics && b.topics[0]) || TECH_TOPIC[(q.tags || [])[0]] || 'algebra';
      out.push({ id: q.id, paper: q.paper, q: q, topic: topic, rating: b.rating,
        a: fit ? fit.a : pr.a, b: fit ? fit.b : pr.b, c: 1 / k });
    });
    return out;
  }

  /* Choose the next question.
     state: {theta, answered: [{item, y}], recent: {id: true}} ; rng: () => [0, 1).
     1. not already answered this session, and not answered in the last fortnight while 10+ others remain;
     2. every 5th question, or after two wrong in a row, an "easier win": predicted chance of success 70-90%;
     3. otherwise content balancing: topics whose share so far is furthest below their share of the pool,
        never the same topic twice running if another is available;
     4. among those, the 5 most informative at the current ability, one picked at random (exposure control). */
  function choose(pool, state, rng) {
    var done = {}; state.answered.forEach(function (r) { done[r.item.id] = 1; });
    var fresh = pool.filter(function (it) { return !done[it.id]; });
    if (!fresh.length) return null;
    var notRecent = fresh.filter(function (it) { return !(state.recent || {})[it.id]; });
    var cand = notRecent.length >= 10 ? notRecent : fresh;
    var th = state.theta, n = state.answered.length, last = state.answered.slice(-2);
    var easy = n > 0 && ((n % 5 === 4) || (last.length === 2 && !last[0].y && !last[1].y));
    var share = {}, seen = {};
    pool.forEach(function (it) { share[it.topic] = (share[it.topic] || 0) + 1 / pool.length; });
    state.answered.forEach(function (r) { seen[r.item.topic] = (seen[r.item.topic] || 0) + 1; });
    var lastTopic = n ? state.answered[n - 1].item.topic : null;
    var topics = {}; cand.forEach(function (it) { topics[it.topic] = 1; });
    var names = Object.keys(topics);
    if (names.length > 1 && lastTopic) names = names.filter(function (t) { return t !== lastTopic; });
    var deficit = function (t) { return share[t] * (n + 1) - (seen[t] || 0); };
    var best = Math.max.apply(null, names.map(deficit));
    var chosen = {}; names.forEach(function (t) { if (deficit(t) >= best - 0.5) chosen[t] = 1; });
    var balanced = cand.filter(function (it) { return chosen[it.topic]; });
    if (easy) {
      /* easier wins follow the same topic rotation; widen to any topic but the last one, then to the closest match */
      var win = function (it) { var p = prob(th, it); return p >= 0.7 && p <= 0.9; };
      var wins = balanced.filter(win);
      if (!wins.length) wins = cand.filter(function (it) { return win(it) && (it.topic !== lastTopic || names.length === 1); });
      if (wins.length) return pick(wins, th, rng, 'easier');
      var closest = balanced.slice().sort(function (x, y) { return Math.abs(prob(th, x) - 0.8) - Math.abs(prob(th, y) - 0.8); });
      return { item: closest[0], why: 'easier' };
    }
    return pick(balanced, th, rng, 'informative');
  }
  function pick(list, th, rng, why) {
    var top = list.slice().sort(function (x, y) { return info(th, y) - info(th, x); }).slice(0, 5);
    return { item: top[Math.floor(rng() * top.length)], why: why };
  }

  function normCdf(z) {                                  /* Abramowitz-Stegun 7.1.26 */
    var t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), e = Math.exp(-z * z / 2);
    var erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * e;
    return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
  }
  function level(score) {
    return score >= 8 ? 'Exceptional' : score >= 7 ? 'Excellent' : score >= 6 ? 'Strong' : score >= 4.5 ? 'Solid' : 'Building';
  }
  function tmua(theta) { return Math.max(1, Math.min(9, TMUA_MEAN + TMUA_SD * theta)); }

  /* Session summary: ability with a likely range, level and percentile, rough TMUA figure, topic strengths. */
  function summary(answered, est, population) {
    var low = est.mean - est.sd, high = est.mean + est.sd;
    var fitted = population && population.fitted;
    var mu = fitted ? population.mean : 0, sd = fitted ? population.sd : 1;
    var topics = {};
    answered.forEach(function (r) {
      var t = topics[r.item.topic] || (topics[r.item.topic] = { topic: r.item.topic, n: 0, right: 0, expected: 0 });
      t.n++; t.right += r.y ? 1 : 0; t.expected += prob(est.mean, r.item);
    });
    var list = Object.keys(topics).map(function (k) { var t = topics[k]; t.residual = t.right - t.expected; return t; })
      .sort(function (x, y) { return x.residual - y.residual; });
    var weak = list.filter(function (t) { return t.n >= 2 && t.residual < 0; });
    return {
      theta: est.mean, sd: est.sd, low: low, high: high, n: answered.length,
      level: level(tmua(est.mean)),
      percentile: Math.round(100 * normCdf((est.mean - mu) / sd)),
      percentileOf: fitted ? 'site users' : 'TMUA candidates',
      tmua: { estimate: Math.round(tmua(est.mean) * 10) / 10, low: Math.round(tmua(low) * 10) / 10, high: Math.round(tmua(high) * 10) / 10,
              label: 'Rough estimate on the TMUA 1.0 to 9.0 scale. Not an official or guaranteed prediction.' },
      topics: list,
      strongest: list.length ? list[list.length - 1].topic : null,
      suggest: weak.length ? weak[0].topic : (list.length ? list[0].topic : null)
    };
  }

  /* Loads locked papers only for papers the visitor has unlocked. locks: window.HU_LOCKS. Returns [questions]. */
  function loadUnlocked(locks) {
    if (!locks || !locks.configured || !locks.configured()) return Promise.resolve([]);
    return locks.scopes().then(function (sc) {
      var papers = Object.keys(locks.meta).filter(function (p) { return sc.indexOf('*') >= 0 || sc.indexOf(p) >= 0; });
      return Promise.all(papers.map(function (p) {
        return locks.questions(p).then(function (qs) { return qs.filter(function (q) { return q.paper === p; }); }, function () { return []; });
      }));
    }).then(function (lists) { return [].concat.apply([], lists); }, function () { return []; });
  }

  var api = { GRID: GRID, TECH_TOPIC: TECH_TOPIC, prob: prob, info: info, eap: eap, buildPool: buildPool, choose: choose,
    summary: summary, loadUnlocked: loadUnlocked, tmua: tmua, normCdf: normCdf };
  root.KV_SMART = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
