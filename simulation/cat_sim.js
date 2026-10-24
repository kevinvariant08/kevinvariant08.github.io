/* Simulation study, part (b): does adaptive selection estimate ability faster than random selection?
     node simulation/cat_sim.js        (needs simulation/results/truth.json from recovery.py)
   Uses the production engine (smart.js). For each simulated student (ability ~ Normal(0.8, 0.9)) and each strategy,
   30 questions are given; answers come from the TRUE parameters. Recorded after every question: the posterior SD
   (the standard error the student is shown) and the actual error of the estimate.
   Strategies: "smart" = Smart Practice as shipped (topic rotation, random pick among the top 5, easier wins);
               "maxinfo" = the single most informative question every time, no constraints;
               "random" = a random unseen question.
   Scenarios: pool = all 440 questions or the 120 free ones; engine parameters = calibrated (it knows the true values)
   or ratings only (it uses the rating-based priors, as on launch day before any data). */
var fs = require('fs'), path = require('path');
var S = require(path.join(__dirname, '..', 'smart.js'));
var T = JSON.parse(fs.readFileSync(path.join(__dirname, 'results', 'truth.json'), 'utf8'));
var bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'item_bank.json'), 'utf8')).items;
var STEPS = 30, PEOPLE = 1000;

/* topics: public tags for free questions, private tags for locked ones when present (used only inside the engine) */
var topic = {}; bank.forEach(function (it) { if (it.topics) topic[it.id] = it.topics[0]; });
var priv = path.join(__dirname, '..', 'private', 'locked_topic_tags.csv');
if (fs.existsSync(priv)) fs.readFileSync(priv, 'utf8').split(/\r?\n/).forEach(function (l) { var x = l.split(','); if (/^[E-L][12]-\d+$/.test(x[0])) topic[x[0]] = x[1]; });
var topicNames = Object.keys(S.TECH_TOPIC).map(function (k) { return S.TECH_TOPIC[k]; });

function mulberry(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function normal(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); }

function items(poolName, params) {
  return T.ids.map(function (id, i) {
    return { id: id, paper: id.split('-')[0], topic: topic[id] || topicNames[i % topicNames.length],
      a: params === 'calibrated' ? T.a[i] : T.prior_a[i], b: params === 'calibrated' ? T.b[i] : T.prior_b[i], c: T.c[i],
      ta: T.a[i], tb: T.b[i] };
  }).filter(function (it, i) { return poolName === 'all' || T.free[i]; });
}
function truthP(theta, it) { return S.prob(theta, { a: it.ta, b: it.tb, c: it.c }); }

function nextItem(strategy, pool, st, r) {
  if (strategy === 'smart') { var c = S.choose(pool, st, r); return c && c.item; }
  var done = {}; st.answered.forEach(function (x) { done[x.item.id] = 1; });
  var fresh = pool.filter(function (it) { return !done[it.id]; });
  if (strategy === 'random') return fresh[Math.floor(r() * fresh.length)];
  var best = null, bi = -1; fresh.forEach(function (it) { var v = S.info(st.theta, it); if (v > bi) { bi = v; best = it; } }); return best;
}

var out = {};
['all', 'free'].forEach(function (poolName) {
  ['calibrated', 'ratings'].forEach(function (params) {
    var pool = items(poolName, params), mu = params === 'calibrated' ? T.population.mean : 0, sd = params === 'calibrated' ? T.population.sd : 1;
    var key = poolName + '/' + params; out[key] = {};
    ['smart', 'maxinfo', 'random'].forEach(function (strategy) {
      var se = new Array(STEPS).fill(0), sq = new Array(STEPS).fill(0), r = mulberry(1234), rp = mulberry(99);
      for (var p = 0; p < PEOPLE; p++) {
        var theta = T.population.mean + T.population.sd * normal(rp);      /* same students for every strategy */
        var st = { theta: mu, answered: [], recent: {} };
        for (var k = 0; k < STEPS; k++) {
          var it = nextItem(strategy, pool, st, r);
          st.answered.push({ item: it, y: r() < truthP(theta, it) });
          var e = S.eap(st.answered, mu, sd); st.theta = e.mean;
          se[k] += e.sd; sq[k] += (e.mean - theta) * (e.mean - theta);
        }
      }
      out[key][strategy] = { se: se.map(function (x) { return +(x / PEOPLE).toFixed(4); }), rmse: sq.map(function (x) { return +Math.sqrt(x / PEOPLE).toFixed(4); }) };
      var reach = function (arr, v) { var i = arr.findIndex(function (x) { return x <= v; }); return i < 0 ? '>' + STEPS : i + 1; };
      console.log(key.padEnd(16), strategy.padEnd(8), 'SE after 10/20/30:', [9, 19, 29].map(function (i) { return out[key][strategy].se[i].toFixed(3); }).join(' '),
        '| RMSE after 10/20/30:', [9, 19, 29].map(function (i) { return out[key][strategy].rmse[i].toFixed(3); }).join(' '),
        '| questions to SE<=0.5:', reach(out[key][strategy].se, 0.5), ' <=0.4:', reach(out[key][strategy].se, 0.4));
    });
  });
});
fs.writeFileSync(path.join(__dirname, 'results', 'cat.json'), JSON.stringify({ people: PEOPLE, steps: STEPS, population: T.population, results: out }, null, 1));
console.log('done');
