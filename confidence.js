/* Confidence calibration: before checking an answer the student says Guess, Unsure or Sure
   (about 30, 60 and 90 percent). Answers in hu_drill_log carry it as conf. The on/off setting is
   hu_confidence; the weekly bonus lives in rewards.js. */
(function(root){
  var LEVELS=[{p:0.3,label:'Guess'},{p:0.6,label:'Unsure'},{p:0.9,label:'Sure'}];
  function load(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
  function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function on(){ var s=load('hu_confidence',null); return !(s&&s.on===false); }
  function set(v){ save('hu_confidence',{on:!!v}); }
  function level(p){ for(var i=0;i<LEVELS.length;i++) if(Math.abs(LEVELS[i].p-p)<1e-9) return LEVELS[i]; return null; }
  function rated(log){ return (log||[]).filter(function(e){ return e&&typeof e.conf==='number'&&level(e.conf); }); }
  function brier(list){ if(!list.length) return null; var s=0; list.forEach(function(e){ var y=e.correct?1:0; s+=(e.conf-y)*(e.conf-y); }); return s/list.length; }
  /* the three buttons; cls is the page's button class */
  function buttons(cls){ return '<div class="confrow" role="group" aria-label="How sure are you?"><span class="conflab">How sure are you?</span>'
    +LEVELS.map(function(l,i){ return '<button type="button" class="'+cls+'" data-conf="'+l.p+'" aria-keyshortcuts="'+(i+1)+'">'+l.label+' <span class="confp">about '+Math.round(l.p*100)+'%</span></button>'; }).join('')+'</div>'; }
  function pct(x){ return Math.round(100*x); }
  /* per level, overall score, and per technique, from the answer log */
  function stats(log,TECH){ var R=rated(log), lv=LEVELS.map(function(l){ var es=R.filter(function(e){ return Math.abs(e.conf-l.p)<1e-9; });
      return {p:l.p,label:l.label,n:es.length,right:es.filter(function(e){ return e.correct; }).length}; });
    var tech={}; R.forEach(function(e){ (e.tags||[]).forEach(function(t){ var s=tech[t]=tech[t]||{t:t,n:0,said:0,right:0}; s.n++; s.said+=e.conf; if(e.correct) s.right++; }); });
    var techs=Object.keys(tech).map(function(t){ var s=tech[t]; return {t:t,name:(TECH&&TECH[t])||t,n:s.n,said:s.said/s.n,acc:s.right/s.n}; });
    return {n:R.length,levels:lv,brier:brier(R),techs:techs}; }
  /* plain verdicts for techniques with at least MIN rated answers; gap of 15 points or more counts */
  var MIN=10, GAP=0.15;
  function verdicts(st){ return st.techs.filter(function(s){ return s.n>=MIN; }).map(function(s){ var g=s.said-s.acc, said=pct(s.said)+' percent sure, '+pct(s.acc)+' percent right.';
      return {gap:g,n:s.n,text:g>=GAP?'You are overconfident in '+s.name+': '+said:g<=-GAP?'You are underconfident in '+s.name+': '+said:'Your confidence in '+s.name+' matches your results: '+said}; })
    .sort(function(a,b){ return Math.abs(b.gap)-Math.abs(a.gap); }); }
  root.HU_CONF={LEVELS:LEVELS,on:on,set:set,level:level,rated:rated,brier:brier,buttons:buttons,stats:stats,verdicts:verdicts,MIN:MIN};
})(window);
