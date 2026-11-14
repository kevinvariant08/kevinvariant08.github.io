/* Classes: shared helpers for classes.html and the "Set by your class" list on progress.html.
   Tables and functions are defined in classes.sql. A student reads their own memberships and the work set
   in those classes; whether each item is done comes from this browser (kv_path and kv_diag). */
(function(){
  var SN={NT:'Number theory',AL:'Algebra',CO:'Combinatorics',GE:'Geometry'};
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function ensurePath(){ return window.KV_PATH?Promise.resolve(window.KV_PATH):loadScript('pathways-data.js?v=20261112c').then(function(){ return window.KV_PATH; }); }

  /* Calls back once with (auth, user). auth is null when accounts cannot load (no config, library blocked, offline). */
  function session(cb){
    var done=false;
    function go(A){ if(done) return; done=true;
      if(!A||!A.configured||!A.client){ cb(null,null); return; }
      A.client.auth.getSession().then(function(r){ cb(A,r&&r.data&&r.data.session?r.data.session.user:null); },function(){ cb(A,null); }); }
    if(window.HU_AUTH) return go(window.HU_AUTH);
    window.addEventListener('hu-auth-ready',function(){ go(window.HU_AUTH); });
    setTimeout(function(){ go(window.HU_AUTH||null); },10000);
  }

  function unitOf(id){ var D=window.KV_PATH, r=null; if(D) D.levels.forEach(function(L){ L.units.forEach(function(u){ if(u.id===id) r=u; }); }); return r; }
  function localPath(){ try{ var o=JSON.parse(localStorage.getItem('kv_path')||'{}'); return o.u||{}; }catch(e){ return {}; } }
  function localDiag(){ try{ return JSON.parse(localStorage.getItem('kv_diag')||'{}')||{}; }catch(e){ return {}; } }
  function started(u){ return !!(u&&(u.read||Object.keys(u.ps||{}).length||Object.keys(u.lad||{}).length)); }

  /* label, link and this student's state for one set item */
  function describe(a){
    if(a.kind==='check'){ var r=localDiag()[a.ref];
      return {title:'Level '+a.ref+' check', href:'diagnostic.html#l'+a.ref, done:!!r, state:r?'Done: '+r.score+'/8':'Not taken'}; }
    var u=unitOf(a.ref), p=localPath()[a.ref];
    return {title:a.ref+': '+(u?u.title:'Pathways unit'), href:'unit.html?u='+encodeURIComponent(a.ref),
      done:!!(p&&p.done), state:p&&p.done?'Done':started(p)?'Started':'Not started'};
  }
  function due(d){ if(!d) return ''; var t=new Date(d+'T12:00:00'); return isNaN(t)?'':t.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
  function overdue(d){ if(!d) return false; var t=new Date(d+'T23:59:59'); return t<new Date(); }

  /* The student's classes with their set work: [{id,name,display_name,joined_at,assignments:[...]}] */
  function myClasses(A,user){
    var sb=A.client;
    return sb.from('class_members').select('class_id,display_name,joined_at,classes(id,name,archived)').eq('user_id',user.id).then(function(r){
      if(r.error) throw r.error;
      var cls=(r.data||[]).filter(function(m){ return m.classes&&!m.classes.archived; }).map(function(m){ return {id:m.class_id,name:m.classes.name,display_name:m.display_name,joined_at:m.joined_at,assignments:[]}; });
      if(!cls.length) return cls;
      return sb.from('class_assignments').select('id,class_id,kind,ref,note,due_date,created_at').in('class_id',cls.map(function(c){ return c.id; })).order('created_at',{ascending:true}).then(function(q){
        if(q.error) throw q.error;
        (q.data||[]).forEach(function(a){ cls.forEach(function(c){ if(c.id===a.class_id) c.assignments.push(a); }); });
        return cls;
      });
    });
  }

  /* weakest strand(s) from a level-check record with a by-strand breakdown */
  function weakest(rec){
    if(!rec||!rec.by||!Object.keys(rec.by).length) return null;
    var ks=['NT','AL','CO','GE'].filter(function(k){ return rec.by[k]!=null; }); if(!ks.length) return null;
    var lo=Math.min.apply(null,ks.map(function(k){ return rec.by[k]; }));
    if(lo>=2) return {keys:[],text:'None'};
    var w=ks.filter(function(k){ return rec.by[k]===lo; });
    return {keys:w,text:w.map(function(k){ return SN[k]; }).join(', ')};
  }

  window.KV_CLASSES={esc:esc,session:session,ensurePath:ensurePath,unitOf:unitOf,describe:describe,due:due,overdue:overdue,myClasses:myClasses,weakest:weakest,strands:SN};
})();
