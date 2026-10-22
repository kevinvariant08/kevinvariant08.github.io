#!/usr/bin/env node
/* Uploads locked TMUA papers to the private 'locked' bucket in Supabase, where locks.js expects them:
     locked/<paper>/questions.json, locked/<paper>/paper.pdf, locked/<paper>/solutions.pdf

   The papers are read from the repository's history (the commit just before they were taken off the
   public site), so nothing needs to be copied by hand.

   Run from the repo folder, in PowerShell:
     $env:SUPABASE_SERVICE_KEY="your service_role (secret) key"
     node tools/upload-locked.js            uploads Sets E, F, G, H and K
     node tools/upload-locked.js --dry-run  lists what it would upload, sends nothing

   The service key is secret: it bypasses all security rules. Never commit it, paste it into a web page,
   or share it. Find it in Supabase > Project Settings > API Keys (service_role, or a secret key). */
'use strict';
var execFileSync = require('child_process').execFileSync;
var fs = require('fs'), path = require('path');

var SOURCE = 'efa4511';                        /* last commit with these papers public */
var PAPERS = ['E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'K1', 'K2'];
var root = path.join(__dirname, '..');
var dry = process.argv.indexOf('--dry-run') >= 0;

function git(args, binary) { return execFileSync('git', args, { cwd: root, encoding: binary ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
try { git(['cat-file', '-e', SOURCE + '^{commit}']); }
catch (e) { console.error('Commit ' + SOURCE + ' is not in this clone. Run "git fetch --unshallow" or "git pull" first, then try again.'); process.exit(1); }

var cfgText = fs.readFileSync(path.join(root, 'auth-config.js'), 'utf8');
var url = (cfgText.match(/url:\s*"([^"]+)"/) || [])[1];
if (!url) { console.error('Could not read the Supabase URL from auth-config.js.'); process.exit(1); }
var key = process.env.SUPABASE_SERVICE_KEY;
if (!dry && !key) { console.error('Set SUPABASE_SERVICE_KEY first. In PowerShell:  $env:SUPABASE_SERVICE_KEY="your-secret-key"'); process.exit(1); }

var qsText = git(['show', SOURCE + ':questions.js']);
var all = JSON.parse(qsText.match(/window\.HU_QUESTIONS=(\[[\s\S]*?\]);/)[1]);

var jobs = [];
PAPERS.forEach(function (p) {
  var qs = all.filter(function (q) { return q.paper === p; });
  if (qs.length !== 20) { console.error(p + ': expected 20 questions in ' + SOURCE + ', found ' + qs.length); process.exit(1); }
  jobs.push({ path: p + '/questions.json', type: 'application/json', body: Buffer.from(JSON.stringify(qs)) });
  var set = p[0], n = p[1];
  jobs.push({ path: p + '/paper.pdf', type: 'application/pdf', body: git(['show', SOURCE + ':HU_Collection_TMUA_Set' + set + '_Paper' + n + '.pdf'], true) });
  jobs.push({ path: p + '/solutions.pdf', type: 'application/pdf', body: git(['show', SOURCE + ':HU_Collection_TMUA_Set' + set + '_Paper' + n + '_Solutions.pdf'], true) });
});

(async function () {
  var failed = 0;
  for (var i = 0; i < jobs.length; i++) {
    var j = jobs[i];
    if (dry) { console.log('would upload locked/' + j.path + ' (' + Math.round(j.body.length / 1024) + ' KB)'); continue; }
    var headers = { apikey: key, 'content-type': j.type, 'x-upsert': 'true' };
    if (/^eyJ/.test(key)) headers.authorization = 'Bearer ' + key;   /* legacy JWT keys; new sb_secret_ keys go in apikey only */
    var res = await fetch(url + '/storage/v1/object/locked/' + j.path, { method: 'POST', headers: headers, body: j.body });
    if (res.ok) console.log('uploaded locked/' + j.path);
    else { failed++; console.log('FAILED  locked/' + j.path + ': ' + res.status + ' ' + (await res.text()).slice(0, 200)); }
  }
  if (dry) return;
  console.log(failed ? '\n' + failed + ' uploads failed; fix the error above and run again (it is safe to repeat).' : '\nAll ' + jobs.length + ' files uploaded. The locked papers will open for anyone who unlocks them.');
})();
