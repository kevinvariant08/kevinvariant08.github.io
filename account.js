/* Accounts core: session state, password policy, and progress sync.
   Loaded by site.js after auth-config.js and the Supabase library. */
(function(){
  var cfg=window.HU_AUTH_CONFIG||{};
  var configured=!!(cfg.url&&cfg.anonKey&&window.supabase&&window.supabase.createClient);
  var client=configured?window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
  var listeners=[], user=null;

  /* ---------------------------------------------------------- password policy
     Mirrors the rules set in the Supabase dashboard, which are what really
     enforce them. This copy exists so people see what's missing as they type. */
  var COMMON=['password','password1','password123','qwerty','qwerty123','letmein','welcome','iloveyou','admin','abc123','123456789','11111111','monkey','dragon','football','sunshine','princess','trustno1','passw0rd','p@ssword','p@ssw0rd','changeme'];
  var BASES=['password','passwort','qwerty','qwertyuiop','asdfgh','letmein','welcome','iloveyou','admin','administrator','monkey','dragon','football','baseball','sunshine','princess','trustno','changeme','master','shadow','superman','batman','login','hello','secret','summer','winter','dubai','kevinvariant'];
  /* Undo the usual disguises (capitals, digits and symbols tacked on, @ for a, 0 for o)
     so "P@ssw0rd123!" is recognised as "password". */
  function core(pw){ return pw.toLowerCase().replace(/[@4]/g,'a').replace(/[0]/g,'o').replace(/[1!|]/g,'i').replace(/[3]/g,'e').replace(/[$5]/g,'s').replace(/[7]/g,'t').replace(/[^a-z]/g,''); }
  function isCommon(pw){
    var c=core(pw), c2=c.replace(/i/g,'l'), c0=pw.toLowerCase().replace(/@/g,'a').replace(/0/g,'o').replace(/\$/g,'s').replace(/[^a-z]/g,'');
    if(c0.length<3) return true;   /* almost no letters: a number with a symbol stuck on */
    return BASES.some(function(b){ return [c,c2,c0].some(function(x){ return x===b||(x.indexOf(b)===0&&x.length-b.length<=2); }); }); }
  function checkPassword(pw,email){
    pw=pw||''; var local=(email||'').split('@')[0].toLowerCase(), low=pw.toLowerCase();
    return [
      {id:'len',  label:'At least 8 characters',            ok:pw.length>=8},
      {id:'upper',label:'An uppercase letter',               ok:/[A-Z]/.test(pw)},
      {id:'lower',label:'A lowercase letter',                ok:/[a-z]/.test(pw)},
      {id:'digit',label:'A number',                          ok:/[0-9]/.test(pw)},
      {id:'sym',  label:'A symbol, such as ! ? # or %',      ok:/[^A-Za-z0-9\s]/.test(pw)},
      {id:'safe', label:'Not a common password or your email name', ok:pw.length>0&&COMMON.indexOf(low)<0&&!isCommon(pw)&&!(local.length>=3&&core(pw).indexOf(core(local))>=0)&&!/^(.)\1+$/.test(pw)&&!/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(pw)}
    ];
  }
  function passwordOk(pw,email){ return checkPassword(pw,email).every(function(r){return r.ok;}); }

  /* ---------------------------------------------------------- errors in plain words */
  function explain(err){
    if(!err) return '';
    var m=String(err.message||err), s=err.status;
    if(s===429||/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute, then try again.';
    if(/invalid login credentials/i.test(m)) return 'That email and password don\u2019t match an account.';
    if(/email not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link, or send a new one below.';
    if(/already registered|already been registered|user already exists/i.test(m)) return 'An account with that email already exists. Sign in, or reset your password.';
    if(/password should|weak password|password is known/i.test(m)) return 'That password doesn\u2019t meet the requirements. '+m;
    if(/same password|different from the old/i.test(m)) return 'Choose a password different from your current one.';
    if(/expired|invalid.*(token|link|otp)|otp_expired/i.test(m)) return 'That link has expired or has already been used. Ask for a new one.';
    if(/failed to fetch|network/i.test(m)) return 'Couldn\u2019t reach the sign-in service. Check your connection and try again.';
    return m;
  }

  /* ---------------------------------------------------------- progress sync */
  var KEYS=['hu_drill_log','hu_drill_attempts','hu_iv_hist','hu_scores','hu_arena','hu_ladder_best','hu_rewards','hu_duels','hu_qotw','hu_review'];
  function readLocal(){ var o={}; KEYS.forEach(function(k){ try{ var v=localStorage.getItem(k); if(v!=null) o[k]=JSON.parse(v); }catch(e){} }); return o; }
  function writeLocal(o){ KEYS.forEach(function(k){ if(o[k]!==undefined){ try{ localStorage.setItem(k,JSON.stringify(o[k])); }catch(e){} } }); }
  function unionBy(a,b,keyFn,cap,sortFn){ var seen={}, out=[]; (a||[]).concat(b||[]).forEach(function(x){ var k=keyFn(x); if(!seen[k]){ seen[k]=1; out.push(x); } }); if(sortFn) out.sort(sortFn); return cap?out.slice(-cap):out; }
  function merge(L,C){
    L=L||{}; C=C||{}; var o={};
    o.hu_drill_log=unionBy(L.hu_drill_log,C.hu_drill_log,function(e){return e.t+'|'+e.id;},2000,function(x,y){return x.t-y.t;});
    o.hu_drill_attempts=unionBy(L.hu_drill_attempts,C.hu_drill_attempts,function(e){return e.date+'|'+e.paper+'|'+e.score+'|'+e.secs;},50);
    o.hu_iv_hist=unionBy(L.hu_iv_hist,C.hu_iv_hist,function(e){return e.date+'|'+e.title+'|'+e.parts+'|'+e.nudges+'|'+e.score;},50);
    o.hu_scores=unionBy(L.hu_scores,C.hu_scores,function(e){return e.date+'|'+e.paper+'|'+e.score;},100);
    var la=L.hu_arena, ca=C.hu_arena, n=function(a){return a?(a.w||0)+(a.l||0)+(a.d||0):-1;};
    if(la||ca){ var base=n(la)>=n(ca)?la:ca, other=base===la?ca:la; o.hu_arena=JSON.parse(JSON.stringify(base));
      o.hu_arena.best=Math.max((la&&la.best)||0,(ca&&ca.best)||0);
      o.hu_arena.history=unionBy(base.history,other&&other.history,function(h){return h.t;},30,function(x,y){return y.t-x.t;}); }
    o.hu_ladder_best=Math.max(L.hu_ladder_best||0,C.hu_ladder_best||0);
    // rewards: banked days take the larger value, one-off events are unioned, so nothing is counted twice
    var lr=L.hu_rewards, cr=C.hu_rewards;
    if(lr||cr){ lr=lr||{}; cr=cr||{}; var rw={bank:{},daily:{},claimed:{}};
      [lr.bank||{},cr.bank||{}].forEach(function(b){ Object.keys(b).forEach(function(k){ rw.bank[k]=Math.max(rw.bank[k]||0,b[k]); }); });
      rw.daily=Object.assign({},cr.daily||{},lr.daily||{}); rw.claimed=Object.assign({},cr.claimed||{},lr.claimed||{});
      rw.frozen=unionBy(lr.frozen,cr.frozen,function(x){return x;}); rw.milestones=unionBy(lr.milestones,cr.milestones,function(x){return x;});
      rw.maxAnswers=Math.max(lr.maxAnswers||0,cr.maxAnswers||0); rw.peakElo=Math.max(lr.peakElo||0,cr.peakElo||0); rw.theme=lr.theme||cr.theme||'indigo';
      rw.lb=(lr.lb!=null?lr.lb:cr.lb)||false; rw.lbName=lr.lbName||cr.lbName||'';
      o.hu_rewards=rw; }
    o.hu_duels=unionBy(L.hu_duels,C.hu_duels,function(h){return h.t;},30,function(x,y){return y.t-x.t;});
    o.hu_qotw=Object.assign({},C.hu_qotw||{},L.hu_qotw||{});
    // review queue: for each question keep whichever device touched it most recently
    var lv=L.hu_review||{}, cv=C.hu_review||{}, items={};
    [cv.items||{},lv.items||{}].forEach(function(src){ Object.keys(src).forEach(function(id){ if(!items[id]||(src[id].last||0)>=(items[id].last||0)) items[id]=src[id]; }); });
    if(L.hu_review||C.hu_review) o.hu_review={items:items,upto:Math.max(lv.upto||0,cv.upto||0)};
    return o;
  }
  var lastPushed='', syncing=false, lastSync=null;
  async function pull(){ var r=await client.from('progress').select('data,updated_at').eq('user_id',user.id).maybeSingle(); if(r.error) throw r.error; return r.data?r.data.data:null; }
  async function push(data){ var body=JSON.stringify(data); if(body===lastPushed) return false;
    var r=await client.from('progress').upsert({user_id:user.id,data:data,updated_at:new Date().toISOString()}); if(r.error) throw r.error; lastPushed=body; return true; }
  async function syncNow(){
    if(!client||!user||syncing) return {ok:false};
    syncing=true;
    try{ var cloud=await pull(), merged=merge(readLocal(),cloud||{}); writeLocal(merged); await push(merged); lastSync=new Date(); emit(); return {ok:true}; }
    catch(e){ return {ok:false,error:explain(e)}; }
    finally{ syncing=false; }
  }
  async function deleteCloudData(){ if(!client||!user) return {ok:false}; var r=await client.from('progress').delete().eq('user_id',user.id); lastPushed=''; return r.error?{ok:false,error:explain(r.error)}:{ok:true}; }
  setInterval(function(){ if(user) syncNow(); },45000);
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden'&&user) syncNow(); });

  /* ---------------------------------------------------------- session */
  function emit(){ listeners.forEach(function(f){ try{ f(user); }catch(e){} }); }
  function onChange(f){ listeners.push(f); f(user); }
  var syncedFor=null;
  function setUser(u){ user=u; if(user&&syncedFor!==user.id){ syncedFor=user.id; syncNow(); } if(!user) syncedFor=null; }
  if(client){
    client.auth.onAuthStateChange(function(event,session){
      setUser(session?session.user:null);
      window.HU_AUTH.lastEvent=event; emit();
      window.dispatchEvent(new CustomEvent('hu-auth-event',{detail:{event:event,session:session}}));
    });
    client.auth.getSession().then(function(r){ setUser(r.data&&r.data.session?r.data.session.user:null); emit(); });
  }

  window.HU_AUTH={configured:configured,client:client,site:cfg.site||(location.origin+'/'),
    user:function(){return user;}, onChange:onChange, updated:function(u){ if(u){ user=u; emit(); } }, checkPassword:checkPassword, passwordOk:passwordOk,
    explain:explain, syncNow:syncNow, lastSync:function(){return lastSync;}, deleteCloudData:deleteCloudData,
    signOut:async function(scope){ if(user) await syncNow(); return client.auth.signOut(scope?{scope:scope}:undefined); }};
  window.dispatchEvent(new Event('hu-auth-ready'));
})();
