#!/usr/bin/env node
/* Uploads locked TMUA papers to the private 'locked' bucket in Supabase, where locks.js expects them:
     locked/<paper>/questions.json, locked/<paper>/paper.pdf, locked/<paper>/solutions.pdf

   Two sources:
   1. Sets E, F, G, H and K were public once, so they are read from the repository's history
      (the commit just before they were taken off the public site).
   2. Sets written locked from the start (Set L onwards) were never public. Their files sit in
      locked-bundles/ encrypted with AES-256; the key is never in the repository.

   Run from the repo folder, in PowerShell:
     $env:SUPABASE_SERVICE_KEY="your service_role (secret) key"
     node tools/upload-locked.js                  uploads Sets E, F, G, H and K
     $env:HU_BUNDLE_KEY="the bundle key"
     node tools/upload-locked.js --bundle setL    uploads Set L from locked-bundles/setL.bin
     node tools/upload-locked.js --bundle setsEK  uploads Sets E, F, G, H and K (watermarked) from locked-bundles/setsEK.bin
   Add --dry-run to list what would be uploaded without sending anything.

   The service key is secret: it bypasses all security rules. Never commit it, paste it into a web page,
   or share it. Find it in Supabase > Project Settings > API Keys (service_role, or a secret key).
   The bundle key is also secret: anyone with it and the public bundle can read the paper. */
'use strict';
var execFileSync = require('child_process').execFileSync;
var fs = require('fs'), path = require('path'), crypto = require('crypto');

var SOURCE = 'efa4511';                        /* last commit with these papers public */
var PAPERS = ['E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'K1', 'K2'];
var root = path.join(__dirname, '..');
var args = process.argv.slice(2);
var dry = args.indexOf('--dry-run') >= 0;
var bi = args.indexOf('--bundle');
var bundle = bi >= 0 ? args[bi + 1] : null;
if (bi >= 0 && !bundle) { console.error('Name the bundle, for example:  node tools/upload-locked.js --bundle setL'); process.exit(1); }

var cfgText = fs.readFileSync(path.join(root, 'auth-config.js'), 'utf8');
var url = (cfgText.match(/url:\s*"([^"]+)"/) || [])[1];
if (!url) { console.error('Could not read the Supabase URL from auth-config.js.'); process.exit(1); }
var key = (process.env.SUPABASE_SERVICE_KEY || '').trim();
if (!dry && !key) { console.error('Set SUPABASE_SERVICE_KEY first. In PowerShell:  $env:SUPABASE_SERVICE_KEY="your-secret-key"'); process.exit(1); }

var jobs = [];
if (bundle) {
  var file = path.join(root, 'locked-bundles', bundle.replace(/\.bin$/, '') + '.bin');
  if (!fs.existsSync(file)) { console.error('No bundle at ' + file + '. Run "git pull" first, then try again.'); process.exit(1); }
  var bkey = (process.env.HU_BUNDLE_KEY || '').trim();
  if (!bkey) { console.error('Set HU_BUNDLE_KEY first. In PowerShell:  $env:HU_BUNDLE_KEY="the-bundle-key"'); process.exit(1); }
  var raw = fs.readFileSync(file), plain;
  try {
    if (raw.slice(0, 4).toString() !== 'HUB1') throw new Error('format');
    var d = crypto.createDecipheriv('aes-256-gcm', Buffer.from(bkey, 'base64url'), raw.slice(4, 16));
    d.setAuthTag(raw.slice(16, 32));
    plain = JSON.parse(Buffer.concat([d.update(raw.slice(32)), d.final()]).toString('utf8'));
  } catch (e) { console.error('Could not open the bundle: the bundle key is wrong, or was copied incompletely.'); process.exit(1); }
  plain.files.forEach(function (f) { jobs.push({ path: f.path, type: f.type, body: Buffer.from(f.b64, 'base64') }); });
} else {
  var git = function (a, binary) { return execFileSync('git', a, { cwd: root, encoding: binary ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024 }); };
  try { git(['cat-file', '-e', SOURCE + '^{commit}']); }
  catch (e) { console.error('Commit ' + SOURCE + ' is no longer in the history. Use the encrypted bundle instead:  node tools/upload-locked.js --bundle setsEK'); process.exit(1); }
  var all = JSON.parse(git(['show', SOURCE + ':questions.js']).match(/window\.HU_QUESTIONS=(\[[\s\S]*?\]);/)[1]);
  PAPERS.forEach(function (p) {
    var qs = all.filter(function (q) { return q.paper === p; });
    if (qs.length !== 20) { console.error(p + ': expected 20 questions in ' + SOURCE + ', found ' + qs.length); process.exit(1); }
    jobs.push({ path: p + '/questions.json', type: 'application/json', body: Buffer.from(JSON.stringify(qs)) });
    var set = p[0], n = p[1];
    jobs.push({ path: p + '/paper.pdf', type: 'application/pdf', body: git(['show', SOURCE + ':HU_Collection_TMUA_Set' + set + '_Paper' + n + '.pdf'], true) });
    jobs.push({ path: p + '/solutions.pdf', type: 'application/pdf', body: git(['show', SOURCE + ':HU_Collection_TMUA_Set' + set + '_Paper' + n + '_Solutions.pdf'], true) });
  });
}

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
