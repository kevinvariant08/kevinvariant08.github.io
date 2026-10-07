/* Locked papers. The questions and PDFs of a locked paper live in a private Supabase bucket;
   the database releases them only to accounts that have redeemed a valid code.
   Nothing secret is in this file: it only asks the server. */
(function(){
  /* The papers that are locked. To lock a new paper, add it here and upload its files to the private bucket. */
  var META={"J1": {"title": "Set J Paper 1", "questions": 20, "rating": 7.4, "max": 8.2}, "J2": {"title": "Set J Paper 2", "questions": 20, "rating": 7.2, "max": 7.9}, "I1": {"title": "Set I Paper 1", "questions": 20, "rating": 7.8, "max": 8.4}, "I2": {"title": "Set I Paper 2", "questions": 20, "rating": 7.8, "max": 8.4}};
  var cache=null;
  function ready(){ return new Promise(function(res){ if(window.HU_AUTH) res(); else window.addEventListener('hu-auth-ready',function(){ res(); },{once:true}); }); }
  function client(){ return window.HU_AUTH&&window.HU_AUTH.client; }
  async function session(){ await ready(); var c=client(); if(!c) return null; var r=await c.auth.getSession(); return r.data&&r.data.session; }
  async function scopes(force){
    var s=await session(); if(!s) return [];
    if(cache&&!force) return cache;
    var r=await client().from('unlocks').select('scope'); if(r.error) throw r.error;
    cache=r.data.map(function(x){ return x.scope; }); return cache;
  }
  async function has(paper){ var sc=await scopes(); return sc.indexOf('*')>=0||sc.indexOf(paper)>=0; }
  async function redeem(code){
    var s=await session(); if(!s) return {ok:false,error:'Sign in first, so the unlock is saved to your account.',signin:true};
    var r=await client().rpc('redeem_code',{p_code:code}); cache=null;
    if(r.error) return {ok:false,error:'Could not reach the server. Check your connection and try again.'};
    return r.data;
  }
  async function questions(paper){
    var r=await client().storage.from('locked').download(paper+'/questions.json');
    if(r.error) throw new Error('This paper is locked for your account.');
    return JSON.parse(await r.data.text());
  }
  async function pdf(paper,kind){
    var r=await client().storage.from('locked').createSignedUrl(paper+'/'+kind+'.pdf',3600);
    if(r.error) throw new Error('This paper is locked for your account.');
    return r.data.signedUrl;
  }
  window.HU_LOCKS={meta:META,isLocked:function(p){ return !!META[p]; },ready:ready,session:session,scopes:scopes,has:has,redeem:redeem,questions:questions,pdf:pdf,
    configured:function(){ return !!(window.HU_AUTH&&window.HU_AUTH.configured); }};
})();
