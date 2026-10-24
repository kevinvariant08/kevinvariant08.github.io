/* Shared site chrome: navigation and logo. Every page includes this file,
   so a change here updates the whole site. */
(function(){
  var LOGO='<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="nav-tg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64"><stop offset="0" stop-color="#FFB020"/><stop offset="0.5" stop-color="#F0507A"/><stop offset="1" stop-color="#2FB8D8"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#nav-tg)"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M32.0 40.1 34.2 40.0 36.3 39.7 38.4 39.3 40.4 38.6 42.2 37.8 44.0 36.8 45.6 35.8 47.0 34.5 48.2 33.2 49.2 31.9 50.0 30.5 50.5 29.0 50.8 27.6 50.9 26.2 50.7 24.9 50.3 23.6 49.7 22.5 48.9 21.5 47.9 20.6 46.7 19.9 45.3 19.4 43.9 19.1 42.3 19.0 40.6 19.1 38.9 19.4 37.2 19.9 35.4 20.7 33.7 21.7 32.0 22.8 30.5 24.2 29.0 25.7 27.6 27.3 26.4 29.1 25.3 31.0 24.5 33.0 23.8 35.0 23.3 37.1 23.0 39.1 22.8 41.1 22.9 43.0 23.2 44.9 23.7 46.6 24.3 48.2 25.1 49.7 26.0 50.9 27.1 52.0 28.2 52.8 29.4 53.4 30.7 53.8 32.0 53.9 33.3 53.8 34.6 53.4 35.8 52.8 36.9 52.0 38.0 50.9 38.9 49.7 39.7 48.2 40.3 46.6 40.8 44.9 41.1 43.0 41.2 41.1 41.0 39.1 40.7 37.1 40.2 35.0 39.5 33.0 38.7 31.0 37.6 29.1 36.4 27.3 35.0 25.7 33.5 24.2 32.0 22.8 30.3 21.7 28.6 20.7 26.8 19.9 25.1 19.4 23.4 19.1 21.7 19.0 20.1 19.1 18.7 19.4 17.3 19.9 16.1 20.6 15.1 21.5 14.3 22.5 13.7 23.6 13.3 24.9 13.1 26.2 13.2 27.6 13.5 29.0 14.0 30.5 14.8 31.9 15.8 33.2 17.0 34.5 18.4 35.8 20.0 36.8 21.8 37.8 23.6 38.6 25.6 39.3 27.7 39.7 29.8 40.0Z" stroke="#F3F1FF" stroke-width="5.6"/><path d="M37.1 39.6 37.8 39.4 38.6 39.2 39.3 39.0 40.0 38.7 40.7 38.5 41.4 38.2 42.1 37.9 42.8 37.5 43.4 37.2 44.0 36.8" stroke="url(#nav-tg)" stroke-width="10.5" stroke-linecap="butt"/><path d="M31.0 40.1 32.0 40.1 33.0 40.1 34.0 40.0 35.0 39.9 36.0 39.8 37.0 39.6 38.0 39.4 38.9 39.1 39.8 38.8 40.7 38.5 41.6 38.1 42.5 37.7 43.3 37.2 44.1 36.8 44.9 36.3 45.6 35.8 46.3 35.2 46.9 34.6 47.5 34.0 48.0 33.4" stroke="#F3F1FF" stroke-width="5.6"/><path d="M24.0 34.3 23.7 35.1 23.5 35.8 23.4 36.6 23.2 37.3 23.1 38.1 23.0 38.8 22.9 39.6 22.9 40.3 22.8 41.0 22.9 41.8" stroke="url(#nav-tg)" stroke-width="10.5" stroke-linecap="butt"/><path d="M26.6 28.8 26.1 29.7 25.6 30.6 25.1 31.5 24.7 32.4 24.3 33.3 24.0 34.3 23.7 35.2 23.5 36.2 23.2 37.1 23.1 38.1 23.0 39.0 22.9 40.0 22.8 40.9 22.9 41.8 22.9 42.7 23.0 43.6 23.1 44.5 23.3 45.3 23.5 46.1 23.8 46.9" stroke="#F3F1FF" stroke-width="5.6"/><path d="M34.9 25.5 34.4 25.0 33.8 24.4 33.2 23.9 32.7 23.4 32.1 22.9 31.5 22.5 30.9 22.0 30.2 21.6 29.6 21.3 29.0 20.9" stroke="url(#nav-tg)" stroke-width="10.5" stroke-linecap="butt"/><path d="M38.4 30.5 37.9 29.6 37.4 28.8 36.8 27.9 36.2 27.1 35.6 26.3 34.9 25.6 34.3 24.9 33.5 24.2 32.8 23.5 32.1 22.9 31.3 22.3 30.5 21.8 29.7 21.3 28.9 20.9 28.1 20.5 27.3 20.1 26.5 19.8 25.7 19.6 24.9 19.3 24.1 19.2" stroke="#F3F1FF" stroke-width="5.6"/></g></svg>';
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
      {href:'esat.html', name:'ESAT home', note:'Mathematics 1 and 2 mocks, newest first'},
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
  /* Light is the default. Dark is remembered per browser; the labs pages lock themselves to dark. */
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
