/* Trap Map: the mistake behind each wrong option, from traps.js.
   Students see a question's traps only once it is reviewed; admins also see drafts, labelled.
   Pure helpers (validate, serialize) also run under node: tools/traps-tool.js. */
(function(root){
  var PAPER_ORDER='BCDEFGHIJ';
  function types(){ return root.HU_TRAP_TYPES||{}; }
  function traps(){ return root.HU_TRAPS||{}; }
  function admin(){ var H=root.HU_REWARDS; try{ return !!(H&&H.isAdmin&&H.isAdmin()); }catch(e){ return false; } }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* the question's entry, if this viewer may see it */
  function entry(id,asAdmin){ var e=traps()[id]; if(!e||!e.opts) return null; if(e.reviewed) return e; return (asAdmin==null?admin():asAdmin)?e:null; }
  function get(id,L,asAdmin){ var e=entry(id,asAdmin), o=e&&e.opts[L], T=types();
    if(!o||o.trap==='none'||!T[o.trap]) return null;
    return {type:o.trap,name:T[o.trap].name,why:o.why||'',draft:!e.reviewed}; }
  /* "You fell for" note shown above the solution; empty when there is nothing to show */
  function note(id,L){ var t=get(id,L); if(!t) return '';
    return '<div class="trapnote"><p><strong>You fell for: '+esc(t.name)+'.</strong> '+t.why+'</p>'
      +(t.draft?'<p class="draft">Draft trap, not reviewed yet. Only admins see this.</p>':'')+'</div>'; }
  /* trap types among a question's visible distractors */
  function typesIn(id,asAdmin){ var e=entry(id,asAdmin), out=[]; if(!e) return out;
    Object.keys(e.opts).forEach(function(L){ var t=e.opts[L].trap; if(t!=='none'&&types()[t]&&out.indexOf(t)<0) out.push(t); }); return out; }
  function questionsWith(type,asAdmin){ return Object.keys(traps()).filter(function(id){ return typesIn(id,asAdmin).indexOf(type)>=0; }).sort(cmpId); }
  /* falls: answers that picked an option with this trap; chances: answers to questions where it was on offer */
  function profile(log,asAdmin){ var T=types(), st={};
    (log||[]).forEach(function(e){ if(!e||!e.id) return;
      typesIn(e.id,asAdmin).forEach(function(t){ st[t]=st[t]||{type:t,falls:0,chances:0,last:0}; st[t].chances++; });
      var g=e.chosen&&get(e.id,e.chosen,asAdmin); if(g&&st[g.type]){ st[g.type].falls++; st[g.type].last=Math.max(st[g.type].last,e.t||0); } });
    return Object.keys(st).map(function(t){ var s=st[t]; s.name=T[t].name; s.d=T[t].d||''; s.n=questionsWith(t,asAdmin).length; return s; })
      .filter(function(s){ return s.falls>0; })
      .sort(function(a,b){ return b.falls-a.falls||(b.falls/b.chances)-(a.falls/a.chances)||b.last-a.last; }); }
  function anyVisible(asAdmin){ var T=traps(); return Object.keys(T).some(function(id){ return typesIn(id,asAdmin).length>0; }); }

  /* ---------------- file format, shared with the admin page and tools/traps-tool.js */
  function cmpId(a,b){ var pa=a.split('-'), pb=b.split('-');
    return PAPER_ORDER.indexOf(pa[0].charAt(0))-PAPER_ORDER.indexOf(pb[0].charAt(0))||pa[0].localeCompare(pb[0])||(+pa[1])-(+pb[1]); }
  function cleanOpt(o){ var c={trap:o.trap}; if(o.why) c.why=o.why; c.working=o.working||''; return c; }
  function serialize(T,Q){
    var head='/* Trap Map data: the mistake behind each wrong option of the free TMUA questions.\n'
      +'   HU_TRAPS[id] = {reviewed, opts: {letter: {trap, why, working}}}. Students only see questions with\n'
      +'   reviewed: true. "working" is the calculation that turns the mistake into that option; it is for review\n'
      +'   and never shown to students. Edit through traps-admin.html or tools/traps-tool.js, which write this format. */\n';
    var t=Object.keys(T).map(function(k){ return JSON.stringify(k)+':'+JSON.stringify({name:T[k].name,d:T[k].d||''}); }).join(',\n');
    var q=Object.keys(Q).sort(cmpId).map(function(id){ var e=Q[id], o={};
      Object.keys(e.opts||{}).sort().forEach(function(L){ o[L]=cleanOpt(e.opts[L]); });
      return JSON.stringify(id)+':'+JSON.stringify({reviewed:!!e.reviewed,opts:o}); }).join(',\n');
    return head+'window.HU_TRAP_TYPES={\n'+t+'\n};\nwindow.HU_TRAPS={\n'+q+'\n};\n'; }

  /* checks for one question's entry; q is the question from questions.js */
  var AMERICAN=/\b(color|behavior|center|favor|analyz|recogniz|minimiz|maximiz|realiz|normaliz|factoriz|organiz|generaliz|summariz)\w*/i;
  function outsideTex(s){ return String(s).replace(/\$[^$]*\$/g,' ').replace(/\\\[[\s\S]*?\\\]/g,' '); }
  function checkEntry(T,q,e){ var errs=[], warn=[], wrong='ABCDEFGH'.slice(0,q.opts.length).split('').filter(function(L){return L!==q.ans;});
    if(typeof e.reviewed!=='boolean') errs.push('reviewed must be true or false');
    var o=e.opts||{};
    wrong.forEach(function(L){ if(!o[L]) errs.push(L+': no entry for this wrong option'); });
    Object.keys(o).forEach(function(L){ var x=o[L];
      if(L===q.ans) errs.push(L+': entry on the correct answer');
      else if(wrong.indexOf(L)<0) errs.push(L+': no such option');
      if(x.trap!=='none'&&!T[x.trap]) errs.push(L+': unknown trap "'+x.trap+'"');
      if(!x.working||!String(x.working).trim()) errs.push(L+': working missing');
      if(x.trap!=='none'){
        if(!x.why||!String(x.why).trim()) errs.push(L+': why missing');
        else { var w=outsideTex(x.why).trim();
          if(!/\.$/.test(w)) warn.push(L+': why should end with a full stop');
          if((w.slice(0,-1).match(/[.!?](\s|$)/g)||[]).length) warn.push(L+': why should be one sentence');
          if(w.length>220) warn.push(L+': why is long ('+w.length+' characters)'); } }
      else if(x.why) warn.push(L+': "none" entries should have no why');
      [x.why,x.working].forEach(function(s){ if(!s) return;
        if(/[—–]|&mdash;|&ndash;/.test(s)) errs.push(L+': em or en dash');
        var m=outsideTex(s).match(AMERICAN); if(m) warn.push(L+': American spelling "'+m[0]+'"'); });
    });
    return {errors:errs,warnings:warn}; }
  function validate(T,Q,questions){ var byId={}, out={errors:[],warnings:[],stats:{questions:0,reviewed:0,options:0,traps:0,none:0}};
    (questions||[]).forEach(function(q){ byId[q.id]=q; });
    Object.keys(T).forEach(function(k){ if(!T[k]||!T[k].name) out.errors.push('type '+k+': no name'); });
    Object.keys(Q).sort(cmpId).forEach(function(id){ var q=byId[id], e=Q[id];
      if(!q){ out.errors.push(id+': not a question in questions.js'); return; }
      var r=checkEntry(T,q,e); r.errors.forEach(function(m){ out.errors.push(id+' '+m); }); r.warnings.forEach(function(m){ out.warnings.push(id+' '+m); });
      out.stats.questions++; if(e.reviewed) out.stats.reviewed++;
      Object.keys(e.opts||{}).forEach(function(L){ out.stats.options++; if(e.opts[L].trap==='none') out.stats.none++; else out.stats.traps++; }); });
    return out; }

  var api={types:types,traps:traps,admin:admin,entry:entry,get:get,note:note,typesIn:typesIn,questionsWith:questionsWith,profile:profile,anyVisible:anyVisible,
    cmpId:cmpId,serialize:serialize,checkEntry:checkEntry,validate:validate};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.HU_TRAPMAP=api;
})(typeof window!=='undefined'?window:this);
