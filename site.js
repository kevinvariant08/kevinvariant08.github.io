/* Shared site chrome: navigation and logo. Every page includes this file,
   so a change here updates the whole site. */
(function(){
  var LOGO='<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="nav-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64"><stop offset="0" stop-color="#262A72"/><stop offset="1" stop-color="#12143A"/></linearGradient><linearGradient id="nav-g" gradientUnits="userSpaceOnUse" x1="12" y1="12" x2="52" y2="52"><stop offset="0" stop-color="#FFC53D"/><stop offset=".5" stop-color="#FF6B8B"/><stop offset="1" stop-color="#4FD8E8"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#nav-bg)"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M32.00 35.67 34.16 35.57 36.30 35.29 38.37 34.82 40.36 34.18 42.24 33.37 43.99 32.41 45.57 31.32 46.98 30.11 48.18 28.82 49.18 27.45 49.95 26.03 50.50 24.60 50.80 23.18 50.87 21.78 50.71 20.45 50.31 19.19 49.70 18.05 48.88 17.03 47.86 16.17 46.67 15.47 45.33 14.96 43.86 14.64 42.28 14.53 40.62 14.64 38.90 14.97 37.16 15.51 35.41 16.26 33.70 17.23 32.04 18.39 30.45 19.73 28.97 21.25 27.61 22.91 26.39 24.70 25.34 26.59 24.46 28.56 23.76 30.58 23.26 32.62 22.95 34.66 22.84 36.67 22.93 38.61 23.21 40.47 23.67 42.21 24.30 43.81 25.09 45.24 26.02 46.49 27.07 47.54 28.21 48.37 29.43 48.98 30.70 49.34 32.00 49.47 33.30 49.34 34.57 48.98 35.79 48.37 36.93 47.54 37.98 46.49 38.91 45.24 39.70 43.81 40.33 42.21 40.79 40.47 41.07 38.61 41.16 36.67 41.05 34.66 40.74 32.62 40.24 30.58 39.54 28.56 38.66 26.59 37.61 24.70 36.39 22.91 35.03 21.25 33.55 19.73 31.96 18.39 30.30 17.23 28.59 16.26 26.84 15.51 25.10 14.97 23.38 14.64 21.72 14.53 20.14 14.64 18.67 14.96 17.33 15.47 16.14 16.17 15.12 17.03 14.30 18.05 13.69 19.19 13.29 20.45 13.13 21.78 13.20 23.18 13.50 24.60 14.05 26.03 14.82 27.45 15.82 28.82 17.02 30.11 18.43 31.32 20.01 32.41 21.76 33.37 23.64 34.18 25.63 34.82 27.70 35.29 29.84 35.57Z" stroke="url(#nav-g)" stroke-width="5.6"/><path d="M37.07 35.14 37.83 34.96 38.58 34.76 39.31 34.54 40.04 34.29 40.75 34.03 41.44 33.74 42.12 33.43 42.78 33.10 43.42 32.74 44.04 32.38" stroke="url(#nav-bg)" stroke-width="10.5" stroke-linecap="butt"/><path d="M30.99 35.64 32.00 35.67 33.01 35.64 34.02 35.58 35.02 35.48 36.01 35.34 37.00 35.15 37.96 34.93 38.91 34.66 39.84 34.36 40.75 34.03 41.63 33.65 42.48 33.25 43.31 32.81 44.10 32.34 44.85 31.84 45.57 31.32 46.25 30.77 46.89 30.20 47.48 29.60 48.03 28.99" stroke="url(#nav-g)" stroke-width="5.6"/><path d="M23.91 30.10 23.68 30.85 23.48 31.60 23.31 32.35 23.17 33.10 23.05 33.85 22.96 34.59 22.89 35.34 22.85 36.07 22.84 36.80 22.86 37.52" stroke="url(#nav-bg)" stroke-width="10.5" stroke-linecap="butt"/><path d="M26.47 24.57 25.95 25.44 25.47 26.33 25.03 27.24 24.62 28.16 24.25 29.09 23.93 30.04 23.64 30.99 23.40 31.94 23.20 32.90 23.05 33.85 22.94 34.80 22.87 35.74 22.84 36.67 22.86 37.58 22.92 38.49 23.02 39.37 23.16 40.23 23.34 41.06 23.57 41.87 23.82 42.65" stroke="url(#nav-g)" stroke-width="5.6"/><path d="M34.94 21.14 34.40 20.57 33.85 20.02 33.29 19.50 32.72 18.99 32.13 18.52 31.53 18.06 30.92 17.63 30.30 17.23 29.68 16.85 29.05 16.50" stroke="url(#nav-bg)" stroke-width="10.5" stroke-linecap="butt"/><path d="M38.43 26.14 37.94 25.25 37.41 24.39 36.85 23.55 36.26 22.73 35.64 21.95 34.98 21.19 34.30 20.47 33.60 19.78 32.87 19.13 32.13 18.52 31.36 17.94 30.58 17.41 29.79 16.92 28.99 16.47 28.18 16.07 27.37 15.71 26.55 15.40 25.74 15.14 24.93 14.92 24.12 14.75" stroke="url(#nav-g)" stroke-width="5.6"/></g></svg>';
  /* Four destinations, organised by what a student is trying to do. Each tool appears once. */
  var GROUPS=[
    {label:'TMUA', sec:'tmua', items:[
      {href:'tmua.html', name:'TMUA home', note:'Every mock set, newest first'},
      {href:'smart.html', name:'Smart Practice', note:'Questions chosen to suit your level'},
      {href:'drill.html', name:'Drill', note:'Sit a paper timed, or drill one technique'},
      {href:'bank.html', name:'Question bank', note:'Every free question, rated 4.5 to 9.0'},
      {href:'techniques.html', name:'Technique index', note:'Questions filed by the idea that cracks them'},
      {href:'review.html', name:'Review mistakes', note:'Wrong answers return after 1, 3 and 7 days'},
      {href:'results.html', name:'Results', note:'Your scores against everyone else'},
      {href:'interviews.html', name:'Mock interviews', note:'Twenty-five minutes, one problem'},
      {href:'unlock.html', name:'Unlock a paper', note:'Redeem a code for a locked set'}]},
    {label:'ESAT', sec:'esat', items:[
      {href:'esat.html', name:'ESAT home', note:'Mathematics 1, Physics and Mathematics 2 mocks'},
      {href:'esat-drill.html', name:'ESAT Drill', note:'27 questions, 40 minutes, or practise by topic'}]},
    {label:'Olympiad', sec:'oly', items:[
      {href:'olympiad.html', name:'Olympiad home', note:'Mock papers, solutions and the HU Collection'},
      {href:'geometry.html', name:'Geometry Lab', note:'Triangle centres you can drag'},
      {href:'sandbox.html', name:'Conjecture sandbox', note:'Build a figure, find what stays true'},
      {href:'marker.html', name:'Proof marker', note:'Get a written solution marked'}]},
    {label:'Practise<span class="lg"> &amp; compete</span>', sec:'play', items:[
      {href:'compete.html', name:'Practise and compete', note:'Everything in this section on one page'},
      {href:'arena.html', name:'Arena', note:'Race a bot to the right answer'},
      {href:'duel.html', name:'Friend duel', note:'Five questions; your friend races your ghost'},
      {href:'qotw.html', name:'Problem of the week', note:'Discussion unlocks when you answer'},
      {href:'rewards.html', name:'Rewards', note:'Levels, badges, quests and the daily challenge'},
      {href:'shop.html', name:'Shop', note:'Spend coins on titles, themes and papers'},
      {href:'games.html', name:'Labs', note:'Maths minigames from the Shop'},
      {href:'progress.html', name:'My progress', note:'Accuracy, timing, traps and confidence'}]},
    {label:'Book', sec:'book', href:'book.html'}
  ];
  var FOOT='<div class="foot-grid">'
    +'<div><b>TMUA</b><a href="tmua.html">Mock sets</a><a href="smart.html">Smart Practice</a><a href="drill.html">Drill</a><a href="bank.html">Question bank</a><a href="techniques.html">Technique index</a></div>'
    +'<div><b>ESAT</b><a href="esat.html">Mock papers</a><a href="esat-drill.html">ESAT Drill</a></div>'
    +'<div><b>Olympiad</b><a href="olympiad.html">Papers and solutions</a><a href="geometry.html">Geometry Lab</a><a href="sandbox.html">Conjecture sandbox</a><a href="marker.html">Proof marker</a></div>'
    +'<div><b>Practise and compete</b><a href="arena.html">Arena</a><a href="qotw.html">Problem of the week</a><a href="rewards.html">Rewards</a><a href="progress.html">My progress</a></div>'
    +'<div><b>About</b><a href="how-it-works.html">How it works</a><a href="how-it-works.html#difficulty">Difficulty scale</a><a href="how-it-works.html#access">Free and locked papers</a><a href="book.html">Beyond the Incenter</a><a href="privacy.html">Privacy</a></div>'
    +'</div><p>Kevinvariant: Oxbridge admissions test (TMUA and ESAT) and olympiad preparation. Scores and progress stay in your browser unless you sign in to sync them, or choose to share answers anonymously (<a href="privacy.html">privacy note</a>).</p>';
  var here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      SUN='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  /* Light is the default on every page. Dark is remembered per browser. */
  function isDark(){ return document.documentElement.getAttribute('data-mode')==='dark'; }
  function paintMode(b){ var d=isDark(); b.innerHTML=d?SUN:MOON; b.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode'); b.title=b.getAttribute('aria-label'); }
  function caret(){return '<svg class="caret" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';}
  function build(nav){
    var h='<div class="bar"><a class="brand" href="index.html">'+LOGO+'<span>Kevinvariant</span></a>'
      +'<button class="mode" type="button"></button><button class="toggle" type="button" aria-expanded="false" aria-controls="navlinks">Menu</button><ul class="links" id="navlinks">';
    GROUPS.forEach(function(g,i){
      if(g.href){ h+='<li class="sec-'+g.sec+'"><a href="'+g.href+'"'+(g.href===here?' aria-current="page"':'')+'>'+g.label+'</a></li>'; return; }
      var cur=g.items.some(function(it){return it.href===here;});
      h+='<li class="sec-'+g.sec+'"><button type="button" class="'+(cur?'current':'')+'" aria-expanded="false" aria-controls="m'+i+'">'+g.label+caret()+'</button><ul class="menu" id="m'+i+'">'
        +g.items.map(function(it){return '<li><a href="'+it.href+'"'+(it.href===here?' aria-current="page"':'')+'>'+it.name+'<small>'+it.note+'</small></a></li>';}).join('')+'</ul></li>';
    });
    nav.innerHTML=h+'</ul></div>';
    nav.classList.add('site-nav'); nav.setAttribute('aria-label','Site');
    var menus=nav.querySelectorAll('.links>li>button');
    function closeAll(except){ menus.forEach(function(b){ if(b!==except){ b.setAttribute('aria-expanded','false'); document.getElementById(b.getAttribute('aria-controls')).classList.remove('open'); } }); }
    menus.forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var open=b.getAttribute('aria-expanded')!=='true'; closeAll(b); b.setAttribute('aria-expanded',String(open)); document.getElementById(b.getAttribute('aria-controls')).classList.toggle('open',open); }); });
    document.addEventListener('click',function(){ closeAll(null); nav.querySelectorAll('.acct .menu.open').forEach(function(m){ m.classList.remove('open'); var b=m.previousElementSibling; if(b) b.setAttribute('aria-expanded','false'); }); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeAll(null); });
    var mb=nav.querySelector('.mode'); paintMode(mb);
    mb.addEventListener('click',function(e){ e.stopPropagation(); var root=document.documentElement, d=!isDark();
      if(d) root.setAttribute('data-mode','dark'); else root.removeAttribute('data-mode');
      try{ localStorage.setItem('kv_mode',d?'dark':'light'); }catch(err){}
      paintMode(mb); window.dispatchEvent(new Event('hu-mode')); });
    var t=nav.querySelector('.toggle'); t.addEventListener('click',function(e){ e.stopPropagation(); var o=!nav.classList.contains('open'); nav.classList.toggle('open',o); t.setAttribute('aria-expanded',String(o)); });
  }
  /* ---------------------------------------------------------- accounts */
  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function esc(t){ return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function accountSlot(nav){
    var ul=nav.querySelector('.links'); if(!ul) return;
    var li=document.createElement('li'); li.className='acct'; ul.appendChild(li);
    function paint(u){
      if(!window.HU_AUTH||!window.HU_AUTH.configured){ li.innerHTML=''; return; }
      if(!u){
        li.innerHTML='<button type="button" class="signin" aria-expanded="false" aria-controls="mguest">Sign in'+caret()+'</button>'
          +'<ul class="menu right" id="mguest">'
          +'<li><a href="auth.html#signin">Sign in<small>Pick up where you left off</small></a></li>'
          +'<li><a href="auth.html#signup">Create an account<small>Free; syncs your progress across devices</small></a></li>'
          +'<li><a href="auth.html#forgot">Forgot your password?<small>We\'ll email you a reset link</small></a></li></ul>';
        var gb=li.querySelector('.signin'), gm=li.querySelector('.menu');
        gb.addEventListener('click',function(e){ e.stopPropagation(); var o=gb.getAttribute('aria-expanded')!=='true'; nav.querySelectorAll('.menu.open').forEach(function(x){ if(x!==gm) x.classList.remove('open'); }); gb.setAttribute('aria-expanded',String(o)); gm.classList.toggle('open',o); });
        /* on auth.html itself, switch views in place rather than reloading */
        if(here==='auth.html') gm.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',function(){ gm.classList.remove('open'); gb.setAttribute('aria-expanded','false'); setTimeout(function(){ window.dispatchEvent(new HashChangeEvent('hashchange')); },0); }); });
        return;
      }
      var name=(u.user_metadata&&u.user_metadata.display_name)||u.email||'Account', init=name.trim().charAt(0).toUpperCase();
      li.innerHTML='<button type="button" class="acct-btn" aria-expanded="false" aria-controls="macct"><span class="acct-av">'+esc(init)+'</span><span class="acct-nm">'+esc(name.split('@')[0])+'</span>'+caret()+'</button>'
        +'<ul class="menu right" id="macct"><li class="me">'+esc(u.email||'')+'</li><li><a href="account.html"'+(here==='account.html'?' aria-current="page"':'')+'>Your account<small>Profile, password and synced progress</small></a></li><li><a href="progress.html">My progress<small>Synced across your devices</small></a></li><li><button type="button" class="out">Sign out</button></li></ul>';
      var b=li.querySelector('.acct-btn'), m=li.querySelector('.menu');
      b.addEventListener('click',function(e){ e.stopPropagation(); var o=b.getAttribute('aria-expanded')!=='true'; nav.querySelectorAll('.menu.open').forEach(function(x){ if(x!==m){ x.classList.remove('open'); } }); b.setAttribute('aria-expanded',String(o)); m.classList.toggle('open',o); });
      li.querySelector('.out').addEventListener('click',async function(){ this.disabled=true; this.textContent='Signing out'; await window.HU_AUTH.signOut(); location.href='auth.html?signedout=1'; });
    }
    window.addEventListener('hu-auth-ready',function(){ window.HU_AUTH.onChange(paint); });
    if(window.HU_AUTH) window.HU_AUTH.onChange(paint);
  }
  function loadRewards(){ if(window.HU_REWARDS) return; var sc=document.createElement('script'); sc.src='rewards.js?v=20261027'; sc.defer=true; document.head.appendChild(sc); }
  function loadAccounts(){
    if(window.HU_AUTH) return;
    loadScript('auth-config.js?v=20260927').catch(function(){}).then(function(){
      var c=window.HU_AUTH_CONFIG||{};
      var lib=(c.url&&c.anonKey)?loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js').catch(function(){}):Promise.resolve();
      return lib.then(function(){ return loadScript('account.js?v=20261023'); });
    }).catch(function(){});
  }
  function init(){
    document.body.setAttribute('data-theme-v2','');
    var nav=document.getElementById('sitenav')||document.querySelector('body>nav');
    if(nav){ build(nav); accountSlot(nav); }
    /* one footer for every page; a page can opt out with <body data-nofoot> */
    if(!document.querySelector('.site-foot')&&!document.body.hasAttribute('data-nofoot')){ var f=document.createElement('footer'); f.className='site-foot'; f.innerHTML=FOOT; document.body.appendChild(f); }
    loadAccounts(); loadRewards();
    loadScript('telemetry.js?v=20261024').catch(function(){});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
