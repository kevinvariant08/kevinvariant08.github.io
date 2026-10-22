/* Trap Map data tool. Run from the repo root.
     node tools/traps-tool.js check                    validate traps.js against questions.js
     node tools/traps-tool.js init types.json          create traps.js with these trap types and no traps
     node tools/traps-tool.js check-draft draft.json   validate a draft file without writing anything
     node tools/traps-tool.js merge draft.json ...     add drafted questions as reviewed: false
       --replace   also overwrite questions that already have an unreviewed draft
   A draft file is {"B1-1": {"A": {"trap", "why", "working"}, ...}, ...}. Reviewed questions are never overwritten.
   Writes traps.js in the same format as traps-admin.html, via trap-map.js. */
var fs=require('fs'), path=require('path'), vm=require('vm');
var ROOT=path.resolve(__dirname,'..'), TM=require(path.join(ROOT,'trap-map.js'));

function loadScript(file){ var ctx={window:{}}; vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file}); return ctx.window; }
function questions(){ return loadScript('questions.js').HU_QUESTIONS; }
function loadTraps(){ var w=loadScript('traps.js'); return {T:w.HU_TRAP_TYPES||{},Q:w.HU_TRAPS||{}}; }
function write(T,Q){ fs.writeFileSync(path.join(ROOT,'traps.js'),TM.serialize(T,Q)); }
function report(r){
  var s=r.stats; console.log(s.questions+' questions ('+s.reviewed+' reviewed), '+s.options+' wrong options: '+s.traps+' traps, '+s.none+' none');
  if(r.warnings.length){ console.log('\n'+r.warnings.length+' warnings'); r.warnings.forEach(function(m){ console.log('  '+m); }); }
  if(r.errors.length){ console.log('\n'+r.errors.length+' errors'); r.errors.forEach(function(m){ console.log('  '+m); }); }
  else console.log('\nNo errors.');
  return r.errors.length?1:0; }

var args=process.argv.slice(2), cmd=args.shift();
if(cmd==='check'){ var d=loadTraps(); process.exit(report(TM.validate(d.T,d.Q,questions()))); }
else if(cmd==='check-draft'){ var dd=loadTraps(), draft=JSON.parse(fs.readFileSync(args[0],'utf8')), only={};
  Object.keys(draft).forEach(function(id){ only[id]={reviewed:false,opts:draft[id]}; });
  process.exit(report(TM.validate(dd.T,only,questions()))); }
else if(cmd==='init'){
  if(fs.existsSync(path.join(ROOT,'traps.js'))){ console.error('traps.js already exists.'); process.exit(1); }
  write(JSON.parse(fs.readFileSync(args[0],'utf8')),{}); console.log('Wrote traps.js'); }
else if(cmd==='merge'){
  var replace=args.indexOf('--replace')>=0, files=args.filter(function(a){ return a!=='--replace'; }), d=loadTraps(), added=0, skipped=[];
  files.forEach(function(f){ var draft=JSON.parse(fs.readFileSync(f,'utf8'));
    Object.keys(draft).forEach(function(id){ var old=d.Q[id];
      if(old&&(old.reviewed||!replace)){ skipped.push(id+(old.reviewed?' (reviewed)':' (draft exists; use --replace)')); return; }
      d.Q[id]={reviewed:false,opts:draft[id]}; added++; }); });
  var r=TM.validate(d.T,d.Q,questions());
  if(r.errors.length){ console.log('Not written: the merged data has errors.'); process.exit(report(r)); }
  write(d.T,d.Q); console.log('Merged '+added+' questions into traps.js.'+(skipped.length?' Skipped: '+skipped.join(', '):''));
  process.exit(report(r)); }
else { console.log(fs.readFileSync(__filename,'utf8').split('*/')[0]); process.exit(1); }
