/* Locked papers. The questions and PDFs of a locked paper live in a private Supabase bucket;
   the database releases them only to accounts that have redeemed a valid code.
   Nothing secret is in this file: it only asks the server. */
(function(){
  /* The papers kept in the private bucket. To lock a new paper, add it here and upload its files to the bucket. */
  var META={"L1": {"title": "Set L Paper 1", "questions": 20, "rating": 8.3, "max": 9.0}, "L2": {"title": "Set L Paper 2", "questions": 20, "rating": 8.3, "max": 9.0}, "J1": {"title": "Set J Paper 1", "questions": 20, "rating": 7.4, "max": 8.2}, "J2": {"title": "Set J Paper 2", "questions": 20, "rating": 7.2, "max": 7.9}, "I1": {"title": "Set I Paper 1", "questions": 20, "rating": 7.8, "max": 8.4}, "I2": {"title": "Set I Paper 2", "questions": 20, "rating": 7.8, "max": 8.4}, "E1": {"title": "Set E Paper 1", "questions": 20, "rating": 6.1, "max": 7.5}, "E2": {"title": "Set E Paper 2", "questions": 20, "rating": 6.1, "max": 7.2}, "F1": {"title": "Set F Paper 1", "questions": 20, "rating": 6.1, "max": 7.2}, "F2": {"title": "Set F Paper 2", "questions": 20, "rating": 6.2, "max": 7.4}, "G1": {"title": "Set G Paper 1", "questions": 20, "rating": 8.0, "max": 8.8}, "G2": {"title": "Set G Paper 2", "questions": 20, "rating": 7.9, "max": 8.6}, "H1": {"title": "Set H Paper 1", "questions": 20, "rating": 7.9, "max": 8.4}, "H2": {"title": "Set H Paper 2", "questions": 20, "rating": 7.7, "max": 8.2}, "K1": {"title": "Set K Paper 1", "questions": 20, "rating": 8.0, "max": 8.8}, "K2": {"title": "Set K Paper 2", "questions": 20, "rating": 8.1, "max": 8.6}};
  /* Papers in the bucket that are released to everyone, signed in or not. This list must match public.paper_release,
     whose storage policy lets anyone read these folders; Sets I onwards stay locked. */
  var FREE={"E1":1,"E2":1,"F1":1,"F2":1,"G1":1,"G2":1,"H1":1,"H2":1};
  var cache=null;
  function ready(){ return new Promise(function(res){ if(window.HU_AUTH) res(); else window.addEventListener('hu-auth-ready',function(){ res(); },{once:true}); }); }
  function client(){ return window.HU_AUTH&&window.HU_AUTH.client; }
  async function session(){ await ready(); var c=client(); if(!c) return null; var r=await c.auth.getSession(); return r.data&&r.data.session; }
  var adminCache=null;
  /* Admin status comes from the server (public.admins); the database, not this flag, is what releases files. */
  async function isAdmin(force){
    var s=await session(); if(!s){ adminCache=null; return false; }
    if(adminCache&&adminCache.uid===s.user.id&&!force) return adminCache.on;
    var r=await client().rpc('hu_is_admin'); var on=!r.error&&r.data===true;
    adminCache={uid:s.user.id,on:on}; return on;
  }
  async function scopes(force){
    var s=await session(); if(!s) return [];
    if(cache&&!force) return cache;
    var r=await client().from('unlocks').select('scope'); if(r.error) throw r.error;
    cache=r.data.map(function(x){ return x.scope; });
    if(await isAdmin(force)) cache.unshift('*');
    return cache;
  }
  async function has(paper){ if(FREE[paper]) return true; var sc=await scopes(); return sc.indexOf('*')>=0||sc.indexOf(paper)>=0; }
  async function redeem(code){
    var s=await session(); if(!s) return {ok:false,error:'Sign in first, so the unlock is saved to your account.',signin:true};
    var r=await client().rpc('redeem_code',{p_code:code}); cache=null;
    if(r.error) return {ok:false,error:'Could not reach the server. Check your connection and try again.'};
    return r.data;
  }
  async function questions(paper){
    await ready(); if(!client()) throw new Error('This paper could not be loaded. Check your connection and reload the page.');
    var r=await client().storage.from('locked').download(paper+'/questions.json');
    if(r.error) throw new Error(FREE[paper]?'This paper could not be loaded. Try again in a moment.':'This paper is locked for your account.');
    return JSON.parse(await r.data.text());
  }
  async function pdf(paper,kind){
    await ready(); if(!client()) throw new Error('This paper could not be loaded. Check your connection and reload the page.');
    var r=await client().storage.from('locked').createSignedUrl(paper+'/'+kind+'.pdf',3600);
    if(r.error) throw new Error(FREE[paper]?'This PDF could not be opened. Try again in a moment.':'This paper is locked for your account.');
    return r.data.signedUrl;
  }
  /* Links written as <a data-open-pdf="E1/paper"> (or "E1/solutions") open that PDF from the bucket in a new tab. */
  if(typeof document!=='undefined') document.addEventListener('click',async function(e){
    var a=e.target.closest&&e.target.closest('a[data-open-pdf]'); if(!a) return; e.preventDefault();
    var p=a.dataset.openPdf.split('/'), w=window.open('','_blank');
    try{ var url=await pdf(p[0],p[1]); if(w) w.location=url; else location.href=url; }
    catch(err){ if(w) w.close(); if(!a.nextElementSibling||!a.nextElementSibling.classList.contains('pdf-err')) a.insertAdjacentHTML('afterend','<span class="lockline pdf-err"> '+err.message+'</span>'); }
  });
  window.HU_LOCKS={meta:META,free:FREE,isAdmin:isAdmin,isFree:function(p){ return !!FREE[p]; },isRemote:function(p){ return !!META[p]; },isLocked:function(p){ return !!META[p]&&!FREE[p]; },ready:ready,session:session,scopes:scopes,has:has,redeem:redeem,questions:questions,pdf:pdf,
    configured:function(){ return !!(window.HU_AUTH&&window.HU_AUTH.configured); }};
})();
