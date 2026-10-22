/* Parses one problem file from marking/problems/ into the object the marker uses.
   Shared by tools/build-marking.js and tools/eval-marker.js.  See marking/README.md for the format. */
'use strict';

var TOPICS = ['geometry', 'number theory', 'algebra', 'combinatorics', 'interview'];
var SECTIONS = ['Problem', 'Solutions', 'Mark scheme', 'Fatal errors', 'Not enough', 'Marked examples'];

function parseProblem(text, file) {
  var errors = [], warnings = [];
  var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  function err(line, msg) { errors.push(file + (line ? ':' + line : '') + ': ' + msg); }
  function warn(line, msg) { warnings.push(file + (line ? ':' + line : '') + ': ' + msg); }

  /* front matter */
  var fm = {}, i = 0;
  if (lines[0] !== '---') { err(1, 'the file must start with a line containing only ---'); return { errors: errors, warnings: warnings }; }
  for (i = 1; i < lines.length && lines[i] !== '---'; i++) {
    var m = lines[i].match(/^([a-z]+)\s*:\s*(.*)$/);
    if (m) fm[m[1]] = { v: m[2].trim(), line: i + 1 };
    else if (lines[i].trim()) err(i + 1, 'front matter lines look like "name: value"');
  }
  if (i >= lines.length) { err(1, 'the front matter is not closed with a second --- line'); return { errors: errors, warnings: warnings }; }
  var bodyStart = i + 1;

  var p = { id: '', title: '', source: '', topic: '', difficulty: 0, max: 0, reviewed: false };
  ['id', 'title', 'source', 'topic', 'difficulty', 'max', 'reviewed'].forEach(function (k) {
    if (!fm[k] || !fm[k].v) err(2, 'front matter is missing "' + k + '"');
  });
  if (fm.id) { p.id = fm.id.v; if (!/^[a-z0-9][a-z0-9-]*$/.test(p.id)) err(fm.id.line, 'id must use lower-case letters, digits and hyphens only'); }
  var base = String(file).split(/[\\/]/).pop().replace(/\.md$/, '');
  if (p.id && base !== p.id) err(fm.id.line, 'id "' + p.id + '" must match the file name "' + base + '.md"');
  if (fm.title) p.title = fm.title.v;
  if (fm.source) p.source = fm.source.v;
  if (fm.topic) { p.topic = fm.topic.v.toLowerCase(); if (TOPICS.indexOf(p.topic) < 0) err(fm.topic.line, 'topic must be one of: ' + TOPICS.join(', ')); }
  if (fm.difficulty) { p.difficulty = Number(fm.difficulty.v); if (!(p.difficulty >= 1 && p.difficulty <= 10)) err(fm.difficulty.line, 'difficulty must be a number from 1 to 10'); }
  if (fm.max) { p.max = Number(fm.max.v); if (!(Number.isInteger(p.max) && p.max > 0 && p.max <= 50)) err(fm.max.line, 'max must be a whole number of marks, for example 10'); }
  if (fm.reviewed) { var rv = fm.reviewed.v.toLowerCase(); if (rv !== 'true' && rv !== 'false') err(fm.reviewed.line, 'reviewed must be true or false'); p.reviewed = rv === 'true'; }

  /* split into ## sections and ### subsections */
  var secs = {}, order = [], cur = null, sub = null;
  for (var j = bodyStart; j < lines.length; j++) {
    var L = lines[j], h2 = L.match(/^##\s+(.+?)\s*$/), h3 = L.match(/^###\s+(.+?)\s*$/);
    if (h2 && !/^###/.test(L)) {
      var name = h2[1];
      if (SECTIONS.indexOf(name) < 0) { err(j + 1, 'unknown section "## ' + name + '". Sections are: ' + SECTIONS.join(', ')); cur = { line: j + 1, lines: [], subs: [] }; sub = null; continue; }
      if (secs[name]) err(j + 1, 'section "## ' + name + '" appears twice');
      cur = secs[name] = { line: j + 1, lines: [], subs: [] }; order.push(name); sub = null; continue;
    }
    if (h3) {
      if (!cur) { err(j + 1, 'a ### heading must sit inside a ## section'); continue; }
      sub = { title: h3[1], line: j + 1, lines: [] }; cur.subs.push(sub); continue;
    }
    if (!cur) { if (L.trim()) err(j + 1, 'text before the first ## section'); continue; }
    (sub ? sub.lines : cur.lines).push({ t: L, n: j + 1 });
  }
  SECTIONS.forEach(function (s) { if (!secs[s]) err(0, 'missing section "## ' + s + '"'); });
  function joinText(arr) { return arr.map(function (x) { return x.t; }).join('\n').replace(/^\s+|\s+$/g, ''); }
  function bullets(arr) {
    var out = [];
    arr.forEach(function (x) {
      if (/^\s*-\s+/.test(x.t)) out.push({ t: x.t.replace(/^\s*-\s+/, ''), n: x.n });
      else if (x.t.trim() && out.length) out[out.length - 1].t += ' ' + x.t.trim();
      else if (x.t.trim()) err(x.n, 'expected a bullet line starting with "- "');
    });
    return out;
  }

  if (secs.Problem) { p.problem = joinText(secs.Problem.lines); if (!p.problem) err(secs.Problem.line, 'the problem statement is empty'); }

  if (secs.Solutions) {
    p.solutions = secs.Solutions.subs.map(function (s) { return { title: s.title, text: joinText(s.lines) }; });
    if (!p.solutions.length) err(secs.Solutions.line, 'give at least one solution under a ### heading');
    p.solutions.forEach(function (s, k) { if (!s.text) err(secs.Solutions.subs[k].line, 'solution "' + s.title + '" is empty'); });
  }

  if (secs['Mark scheme']) {
    p.checkpoints = []; p.caps = [];
    bullets(secs['Mark scheme'].lines).forEach(function (b) {
      var cap = b.t.match(/^Cap\s+(\d+)\s*:\s*(.+)$/i);
      var cp = b.t.match(/^\[(\d+)\]\s*(?:\(Route\s+([A-Z])\)\s*)?(.+)$/);
      if (cap) p.caps.push({ cap: Number(cap[1]), text: cap[2].trim() });
      else if (cp) p.checkpoints.push({ id: 'c' + (p.checkpoints.length + 1), marks: Number(cp[1]), route: cp[2] || '', text: cp[3].trim() });
      else err(b.n, 'mark scheme lines look like "- [2] what earns the marks", "- [2] (Route A) ..." or "- Cap 5: when the cap applies"');
    });
    if (!p.checkpoints.length) err(secs['Mark scheme'].line, 'the mark scheme has no checkpoints');
    var common = 0, routes = {};
    p.checkpoints.forEach(function (c) { if (c.route) routes[c.route] = (routes[c.route] || 0) + c.marks; else common += c.marks; });
    var rk = Object.keys(routes);
    if (p.max) {
      if (!rk.length && common !== p.max) err(secs['Mark scheme'].line, 'the checkpoints add up to ' + common + ' but max is ' + p.max);
      rk.forEach(function (r) { if (common + routes[r] !== p.max) err(secs['Mark scheme'].line, 'route ' + r + ' adds up to ' + (common + routes[r]) + ' (shared checkpoints ' + common + ' plus route ' + routes[r] + ') but max is ' + p.max); });
      if (rk.length === 1) warn(secs['Mark scheme'].line, 'only one route (' + rk[0] + ') is defined; routes are for alternative solutions');
      p.caps.forEach(function (c) { if (c.cap >= p.max) err(secs['Mark scheme'].line, 'a cap of ' + c.cap + ' is not below max ' + p.max); });
    }
    p.routes = rk.sort();
  }

  if (secs['Fatal errors']) p.fatal = bullets(secs['Fatal errors'].lines).map(function (b) { return b.t; });
  if (secs['Not enough']) p.notEnough = bullets(secs['Not enough'].lines).map(function (b) { return b.t; });

  if (secs['Marked examples']) {
    p.examples = secs['Marked examples'].subs.map(function (s) {
      var ex = { title: s.title, mark: null, comment: '', script: '' }, rest = [], k = 0;
      for (; k < s.lines.length; k++) {
        var t = s.lines[k].t, mm = t.match(/^Mark:\s*(\d+)\s*$/i), cm = t.match(/^Comment:\s*(.+)$/i);
        if (mm) ex.mark = Number(mm[1]);
        else if (cm) ex.comment = cm[1].trim();
        else { rest = s.lines.slice(k); break; }
      }
      ex.script = joinText(rest);
      if (ex.mark === null) err(s.line, 'example "' + s.title + '" needs a "Mark: N" line straight after its heading');
      else if (p.max && ex.mark > p.max) err(s.line, 'example "' + s.title + '" has mark ' + ex.mark + ', above max ' + p.max);
      if (!ex.comment) err(s.line, 'example "' + s.title + '" needs a "Comment: ..." line after its mark');
      if (!ex.script) err(s.line, 'example "' + s.title + '" has no script text');
      return ex;
    });
    if (!p.examples.length) err(secs['Marked examples'].line, 'give at least one marked example under a ### heading');
    else if (p.examples.length < 3) warn(secs['Marked examples'].line, 'three or more examples (full marks, partial, convincing but wrong) make marking much more consistent');
    if (p.examples.length && p.max && !p.examples.some(function (e) { return e.mark === p.max; })) warn(secs['Marked examples'].line, 'no example has full marks');
  }

  return { problem: errors.length ? null : p, errors: errors, warnings: warnings };
}

module.exports = { parseProblem: parseProblem, TOPICS: TOPICS, SECTIONS: SECTIONS };
