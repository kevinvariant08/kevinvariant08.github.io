/* Pathways: progress storage shared by pathways.html and unit.html.
   Progress lives in localStorage under kv_path and is synced by account.js when signed in.
   Shape: {level: n|null, u: {UNIT_ID: {read: t, ps: {i: 'got'|'not'}, lad: {i: t}, done: t}}} */
(function(){
  var KEY='kv_path';
  function load(){ try{ var o=JSON.parse(localStorage.getItem(KEY)||'{}'); o.u=o.u||{}; return o; }catch(e){ return {u:{}}; } }
  function save(o){ try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} window.dispatchEvent(new Event('kv-path')); }
  function unit(o,id){ return o.u[id]||(o.u[id]={ps:{},lad:{}}); }
  var P={
    get:load,
    level:function(){ return load().level||null; },
    setLevel:function(n){ var o=load(); o.level=n; save(o); },
    unit:function(id){ var u=load().u[id]||{}; u.ps=u.ps||{}; u.lad=u.lad||{}; return u; },
    markRead:function(id,on){ var o=load(), u=unit(o,id); if(on===false) delete u.read; else u.read=Date.now(); save(o); },
    markPractice:function(id,i,val){ var o=load(), u=unit(o,id); u.ps=u.ps||{}; if(val) u.ps[i]=val; else delete u.ps[i]; save(o); },
    markLadder:function(id,i,on){ var o=load(), u=unit(o,id); u.lad=u.lad||{}; if(on) u.lad[i]=Date.now(); else delete u.lad[i]; save(o); },
    markDone:function(id,on){ var o=load(), u=unit(o,id); if(on===false) delete u.done; else u.done=Date.now(); save(o); },
    /* fraction of a unit finished: lesson read, practice marked, ladder ticked */
    score:function(id,nPractice,nLadder){
      var u=P.unit(id); if(u.done) return 1;
      var got=Object.keys(u.ps).filter(function(k){ return u.ps[k]==='got'; }).length;
      var parts=(u.read?1:0)+got/(nPractice||6)+Object.keys(u.lad).length/(nLadder||10);
      return Math.min(0.99,parts/3);
    },
    started:function(id){ var u=P.unit(id); return !!(u.read||u.done||Object.keys(u.ps).length||Object.keys(u.lad).length); }
  };
  window.KV_PROGRESS=P;
})();

/* Fill in course totals wherever the page shows them, so the figures never go stale. */
(function(){
  function fill(){ var D=window.KV_PATH; if(!D) return; var n=0,np=0,nl=0;
    D.levels.forEach(function(L){ L.units.forEach(function(u){ if(u.status==='ready'){ n++; np+=u.np||0; nl+=u.nl||0; } }); });
    [['kv-nunits',n],['kv-np',np],['kv-nl',nl]].forEach(function(x){ document.querySelectorAll('.'+x[0]).forEach(function(e){ e.textContent=x[1]; }); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fill); else fill();
})();
