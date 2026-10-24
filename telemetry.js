/* Anonymous answer sharing for Smart Practice calibration. Loaded on every page by site.js.
   Nothing is sent until the visitor chooses "Share anonymously" on a short notice; answers made before that
   choice, or after "Keep on this device", never leave the browser. Each shared answer is: question id, option
   chosen, right or wrong, seconds taken, when, and the practice mode, with a random id made here (kv_share.id).
   Requests use only the site's public key, never the visitor's sign-in token, so they cannot be tied to an account.
   Pages report answers with  window.KV_TELEMETRY && KV_TELEMETRY.record(entry)  where entry is the hu_drill_log row. */
(function(){
  if(window.KV_TELEMETRY) return;
  var CHOICE='kv_share', OUT='kv_outbox', MAX_OUT=500, BATCH=50;
  var ID=/^[A-L][12]-([1-9]|1[0-9]|20)$/;
  var timer=null, sending=false, backoff=0;

  function get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function uuid(){
    if(window.crypto&&crypto.randomUUID) return crypto.randomUUID();
    var b=crypto.getRandomValues(new Uint8Array(16)); b[6]=b[6]&15|64; b[8]=b[8]&63|128;
    var h=Array.prototype.map.call(b,function(x){ return (x+256).toString(16).slice(1); }).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }
  function choice(){ var c=get(CHOICE); return c&&(c.choice==='yes'||c.choice==='no')&&c.id?c:null; }
  function config(){ var c=window.HU_AUTH_CONFIG; return c&&c.url&&c.anonKey?c:null; }
  function key(r){ return r.q+'|'+r.t; }

  function setChoice(v){
    if(v!=='yes'&&v!=='no') return;
    var c=choice();
    put(CHOICE,{choice:v,at:Date.now(),id:(c&&c.id)||uuid()});
    if(v==='no') put(OUT,[]);
    hideNotice();
    if(v==='yes') schedule(2000);
  }

  /* Called by pages for every answer they log. */
  function record(e){
    var c=choice();
    if(!c){ showNotice(); return; }
    if(c.choice!=='yes'||!e||!ID.test(e.id)||!/^[A-H]$/.test(e.chosen||'')) return;
    var t=typeof e.t==='number'?e.t:Date.now();
    if(t<c.at) return;                                   /* answered before the visitor agreed */
    var mode=String(e.mode||'other').toLowerCase().replace(/[^a-z]/g,'').slice(0,12);
    var row={q:e.id,c:e.chosen,ok:!!e.correct,s:Math.max(0,Math.min(7200,Math.round(+e.secs||0))),
             t:new Date(t).toISOString(),m:mode.length>=2?mode:'other'};
    var o=get(OUT)||[]; o.push(row); put(OUT,o.slice(-MAX_OUT));
    schedule();
  }

  function schedule(ms){ if(timer) return; timer=setTimeout(function(){ timer=null; flush(); },ms==null?5000:ms); }
  function retry(){ backoff=Math.min(backoff?backoff*2:30000,30*60000); if(timer){ clearTimeout(timer); timer=null; } schedule(backoff); }
  function drop(sent){ var s={}; sent.forEach(function(r){ s[key(r)]=1; }); put(OUT,(get(OUT)||[]).filter(function(r){ return !s[key(r)]; })); }

  function rpc(name,body,keepalive){
    var cfg=config(); if(!cfg) return Promise.reject(new Error('not configured'));
    return fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',keepalive:!!keepalive,credentials:'omit',
      headers:{'apikey':cfg.anonKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
  }

  /* Sends the oldest batch. Never throws and never blocks the page. */
  function flush(keepalive){
    var c=choice(), batch=(get(OUT)||[]).slice(0,BATCH);
    if(!c||c.choice!=='yes'||!batch.length||sending||!config()) return Promise.resolve();
    sending=true;
    return rpc('hu_log_attempts',{p_anon:c.id,p_rows:batch},keepalive)
      .then(function(r){
        if(r.ok) return r.json();
        return {ok:false,retry:r.status>=500||r.status===429||r.status===404};  /* 404: database not set up yet */
      })
      .then(function(res){
        sending=false;
        if(res&&res.ok){ drop(batch); backoff=0; if((get(OUT)||[]).length) schedule(1000); }
        else if(res&&res.retry) retry();
        else drop(batch);                                /* rejected outright: do not let it block the queue */
      })
      .catch(function(){ sending=false; retry(); });
  }

  /* Privacy page: delete everything shared from this browser, then start a fresh random id. */
  function forget(){
    var c=choice(); if(!c) return Promise.resolve({ok:true,deleted:0});
    return rpc('hu_forget_attempts',{p_anon:c.id}).then(function(r){ return r.json(); }).then(function(res){
      if(res&&res.ok){ put(OUT,[]); put(CHOICE,{choice:c.choice,at:Date.now(),id:uuid()}); }
      return res;
    });
  }

  var notice=null;
  var CSS='.kv-share{position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:36rem;margin:0 auto;padding:1rem 1.1rem;'
    +'background:var(--surface,#fff);color:var(--ink,#222);border:1px solid var(--line,#ccc);border-radius:var(--r-lg,12px);'
    +'box-shadow:0 6px 24px rgba(0,0,0,.12);font-size:.95rem;line-height:1.45}'
    +'.kv-share p{margin:0 0 .8rem}.kv-share-acts{display:flex;flex-wrap:wrap;gap:.6rem}';
  function showNotice(){
    if(notice||choice()||!document.body) return;
    if(!document.getElementById('kv-share-css')){ var st=document.createElement('style'); st.id='kv-share-css'; st.textContent=CSS; document.head.appendChild(st); }
    notice=document.createElement('div');
    notice.className='kv-share'; notice.setAttribute('role','region'); notice.setAttribute('aria-label','Sharing answers');
    notice.innerHTML='<p><b>Help us rate the questions fairly.</b> Can we share your answers anonymously? We would send only '
      +'the question, the option you picked, whether it was right, how long you took and when, with a random code instead of '
      +'your name. Never your name, email or account. <a href="privacy.html">Privacy note</a></p>'
      +'<div class="kv-share-acts"><button type="button" class="btn" data-share="yes">Share anonymously</button>'
      +'<button type="button" class="btn2" data-share="no">Keep on this device</button></div>';
    notice.addEventListener('click',function(ev){ var v=ev.target.getAttribute&&ev.target.getAttribute('data-share'); if(v) setChoice(v); });
    document.body.appendChild(notice);
  }
  function hideNotice(){ if(notice){ notice.remove(); notice=null; } }

  window.KV_TELEMETRY={record:record,choice:choice,setChoice:setChoice,flush:flush,forget:forget,showNotice:showNotice,
    pending:function(){ return (get(OUT)||[]).length; }};
  window.addEventListener('pagehide',function(){ flush(true); });
  schedule(3000);
})();
