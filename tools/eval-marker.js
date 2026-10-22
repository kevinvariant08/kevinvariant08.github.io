#!/usr/bin/env node
/* Measures how often the Proof marker agrees with the examiner's own marks.

   Test scripts live in marking/eval/<problem-id>/<script-name>.md (see marking/eval/README.md).
   The tool runs the real two-pass marker, the same code as the website, on each one.

   Usage, from the repo folder:
     node tools/eval-marker.js --dry-run                     list the scripts and estimate the size of the run
     node tools/eval-marker.js                               run it (asks before spending anything)
   Options:
     --provider anthropic|gemini|openai   which API to use (default anthropic)
     --model NAME                         the model (defaults below)
     --problem ID                         only this problem
     --include-drafts                     also run scripts marked reviewed: false
     --single-pass                        skip the second check, to compare against two-pass
     --price-in N --price-out N           US dollars per million input and output tokens, for a cost estimate
     --yes                                do not ask for confirmation
   The API key comes from ANTHROPIC_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY in your environment.
   It is never written to any file. */
'use strict';
var fs = require('fs'), path = require('path'), readline = require('readline');
var M = require('../marking/marker-core.js');
var parseProblem = require('./marking-parse.js').parseProblem;

var root = path.join(__dirname, '..');
var args = process.argv.slice(2);
function opt(name, d) { var i = args.indexOf('--' + name); return i >= 0 && args[i + 1] && args[i + 1].indexOf('--') !== 0 ? args[i + 1] : d; }
function flag(name) { return args.indexOf('--' + name) >= 0; }
var provider = opt('provider', 'anthropic');
var DEFAULT_MODELS = { anthropic: 'claude-sonnet-5', gemini: 'gemini-2.5-flash', openai: 'gpt-5.4-mini' };
var model = opt('model', DEFAULT_MODELS[provider]);
var KEYVAR = { anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY' }[provider];
if (!KEYVAR) { console.error('Unknown provider "' + provider + '". Use anthropic, gemini or openai.'); process.exit(1); }

/* ---------------------------------------------------------- load problems and scripts */
var probDir = path.join(root, 'marking', 'problems'), evalDir = path.join(root, 'marking', 'eval');
var problems = {};
fs.readdirSync(probDir).filter(function (f) { return /\.md$/.test(f); }).forEach(function (f) {
  var res = parseProblem(fs.readFileSync(path.join(probDir, f), 'utf8'), 'marking/problems/' + f);
  if (res.problem) problems[res.problem.id] = res.problem;
  else res.errors.forEach(function (e) { console.error('ERROR  ' + e); });
});

function parseScript(text, file) {
  var lines = text.replace(/\r\n?/g, '\n').split('\n'), fm = {}, i;
  if (lines[0] !== '---') throw new Error(file + ': must start with a --- front matter block');
  for (i = 1; i < lines.length && lines[i] !== '---'; i++) { var m = lines[i].match(/^([a-z]+)\s*:\s*(.*)$/); if (m) fm[m[1]] = m[2].trim(); }
  var mark = Number(fm.mark);
  if (!Number.isInteger(mark)) throw new Error(file + ': front matter needs "mark: N"');
  return { mark: mark, sound: fm.sound ? fm.sound === 'true' : null, reviewed: fm.reviewed !== 'false', comment: fm.comment || '', script: lines.slice(i + 1).join('\n').trim() };
}
var scripts = [];
if (fs.existsSync(evalDir)) fs.readdirSync(evalDir).forEach(function (pid) {
  var d = path.join(evalDir, pid);
  if (!fs.statSync(d).isDirectory() || pid === 'results') return;
  if (opt('problem') && opt('problem') !== pid) return;
  if (!problems[pid]) { console.error('note   marking/eval/' + pid + '/ has no matching problem in marking/problems/, skipped'); return; }
  fs.readdirSync(d).filter(function (f) { return /\.md$/.test(f); }).sort().forEach(function (f) {
    try {
      var s = parseScript(fs.readFileSync(path.join(d, f), 'utf8'), 'marking/eval/' + pid + '/' + f);
      if (s.mark > problems[pid].max) throw new Error('marking/eval/' + pid + '/' + f + ': mark above max');
      if (!s.reviewed && !flag('include-drafts')) return;
      s.pid = pid; s.name = f.replace(/\.md$/, ''); if (s.sound === null) s.sound = s.mark === problems[pid].max;
      scripts.push(s);
    } catch (e) { console.error('ERROR  ' + e.message); }
  });
});
if (!scripts.length) { console.log('No test scripts to run. Add some to marking/eval/<problem-id>/ (see marking/eval/README.md), or pass --include-drafts.'); process.exit(0); }

/* ---------------------------------------------------------- estimate */
var single = flag('single-pass');
var estIn = 0;
scripts.forEach(function (s) {
  var ctx = { lib: problems[s.pid], sol: s.script, arith: M.checkArithmetic(s.script) };
  var p = M.buildMarkPrompt(ctx).length;
  estIn += p / 3.5 * (single ? 1 : 2.4);
});
var estOut = scripts.length * (single ? 700 : 1600);
var pin = Number(opt('price-in', NaN)), pout = Number(opt('price-out', NaN));
console.log(scripts.length + ' test script' + (scripts.length > 1 ? 's' : '') + ' across ' + Object.keys(scripts.reduce(function (a, s) { a[s.pid] = 1; return a; }, {})).length + ' problem(s). Provider ' + provider + ', model ' + model + (single ? ', single pass' : ', two-pass') + '.');
console.log('Estimated size: about ' + Math.round(estIn / 1000) + 'k input tokens and ' + Math.round(estOut / 1000) + 'k output tokens.');
if (isFinite(pin) && isFinite(pout)) console.log('Estimated cost: about $' + (estIn / 1e6 * pin + estOut / 1e6 * pout).toFixed(2) + '.');
else console.log('Add --price-in and --price-out (dollars per million tokens, from your provider\'s pricing page) for a cost estimate.');
if (flag('dry-run')) process.exit(0);
var key = process.env[KEYVAR];
if (!key) { console.error('Set ' + KEYVAR + ' in your environment first. In PowerShell: $env:' + KEYVAR + '="your-key"'); process.exit(1); }

/* ---------------------------------------------------------- calling the model */
async function call(prompt) {
  var res, d;
  if (provider === 'anthropic') {
    res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }) });
    d = await res.json(); if (!res.ok) throw new Error((d.error && d.error.message) || ('HTTP ' + res.status));
    return (d.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
  }
  if (provider === 'gemini') {
    res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0.2 } }) });
    d = await res.json(); if (!res.ok) throw new Error((d.error && d.error.message) || ('HTTP ' + res.status));
    return ((d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []).map(function (x) { return x.text || ''; }).join('');
  }
  res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, max_completion_tokens: 6000 }) });
  d = await res.json(); if (!res.ok) throw new Error((d.error && d.error.message) || ('HTTP ' + res.status));
  return d.choices[0].message.content || '';
}

function confirm() {
  if (flag('yes')) return Promise.resolve(true);
  var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(function (res) { rl.question('Run it now? (y/N) ', function (a) { rl.close(); res(/^y/i.test(a)); }); });
}

/* ---------------------------------------------------------- run */
(async function () {
  if (!(await confirm())) { console.log('Cancelled. Nothing was sent.'); return; }
  var rows = [];
  for (var i = 0; i < scripts.length; i++) {
    var s = scripts[i], L = problems[s.pid];
    var ctx = { lib: L, sol: s.script, arith: M.checkArithmetic(s.script), singlePass: single };
    process.stdout.write('[' + (i + 1) + '/' + scripts.length + '] ' + s.pid + '/' + s.name + ' ... ');
    try {
      var r = await M.markTwoPass(call, ctx);
      M.applyArithmetic(r, ctx.arith);
      var diff = r.score - s.mark;
      rows.push({ pid: s.pid, script: s.name, examiner: s.mark, marker: r.score, diff: diff, examinerSound: s.sound, markerSound: r.sound, uncertain: !!r.uncertain, passes: r.passes, max: L.max, verdict: r.verdict });
      console.log('examiner ' + s.mark + ', marker ' + r.score + (diff ? ' (' + (diff > 0 ? '+' : '') + diff + ')' : '') + (r.uncertain ? ', flagged uncertain' : ''));
    } catch (e) {
      rows.push({ pid: s.pid, script: s.name, examiner: s.mark, error: String(e.message || e).slice(0, 200) });
      console.log('failed: ' + String(e.message || e).slice(0, 120));
    }
  }
  function stats(list) {
    var ok = list.filter(function (r) { return !r.error; }), n = ok.length;
    if (!n) return { n: 0 };
    var within1 = ok.filter(function (r) { return Math.abs(r.diff) <= 1; }).length;
    var mad = ok.reduce(function (a, r) { return a + Math.abs(r.diff); }, 0) / n;
    var unsound = ok.filter(function (r) { return !r.examinerSound; }), sound = ok.filter(function (r) { return r.examinerSound; });
    return {
      n: n, failed: list.length - n, within1: within1 / n, meanAbsDiff: mad, meanSignedDiff: ok.reduce(function (a, r) { return a + r.diff; }, 0) / n,
      falseSound: unsound.length ? unsound.filter(function (r) { return r.markerSound; }).length / unsound.length : null,
      falseUnsound: sound.length ? sound.filter(function (r) { return !r.markerSound; }).length / sound.length : null,
      uncertain: ok.filter(function (r) { return r.uncertain; }).length / n
    };
  }
  function pct(x) { return x === null || x === undefined ? 'n/a' : Math.round(x * 100) + '%'; }
  function line(name, st) {
    return name + ': ' + st.n + ' scripts, within 1 mark ' + pct(st.within1) + ', mean difference ' + (st.n ? st.meanAbsDiff.toFixed(2) : 'n/a')
      + (st.n ? ' (marker ' + (st.meanSignedDiff >= 0 ? 'higher' : 'lower') + ' by ' + Math.abs(st.meanSignedDiff).toFixed(2) + ' on average)' : '')
      + ', called unsound proofs sound ' + pct(st.falseSound) + ', called sound proofs unsound ' + pct(st.falseUnsound) + ', flagged uncertain ' + pct(st.uncertain);
  }
  var byProblem = {};
  rows.forEach(function (r) { (byProblem[r.pid] = byProblem[r.pid] || []).push(r); });
  console.log('');
  Object.keys(byProblem).sort().forEach(function (pid) { console.log(line(pid, stats(byProblem[pid]))); });
  var overall = stats(rows);
  console.log(line('OVERALL', overall));

  var stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  var resDir = path.join(evalDir, 'results');
  if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
  var resFile = path.join(resDir, stamp + '.json');
  fs.writeFileSync(resFile, JSON.stringify({ date: new Date().toISOString(), provider: provider, model: model, twoPass: !single, includeDrafts: flag('include-drafts'), overall: overall, byProblem: Object.keys(byProblem).reduce(function (a, k) { a[k] = stats(byProblem[k]); return a; }, {}), rows: rows }, null, 2));
  console.log('\nSaved marking/eval/results/' + path.basename(resFile));

  /* the website shows the headline figure only from a full, reviewed, two-pass run of at least 50 scripts */
  if (!single && !flag('include-drafts') && !opt('problem') && overall.n >= 50) {
    fs.writeFileSync(path.join(evalDir, 'latest.js'), '/* Written by tools/eval-marker.js. */\nwindow.HU_MARKER_AGREEMENT=' + JSON.stringify({ n: overall.n, within1: Math.round(overall.within1 * 100), date: new Date().toISOString().slice(0, 10), model: model }) + ';\n');
    console.log('Updated marking/eval/latest.js: the Proof marker page will show this figure once you push.');
  } else {
    console.log('The website figure was not updated: that needs a full two-pass run of at least 50 reviewed scripts.');
  }
})();
