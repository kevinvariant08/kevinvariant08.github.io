/* Shared site chrome: navigation and logo. Every page includes this file,
   so a change here updates the whole site. */
(function(){
  var LOGO='<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="nav-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#262A72"/><stop offset="1" stop-color="#12143A"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#nav-bg)" stroke="#343A82"/><g transform="translate(32,32) scale(0.8) translate(-34.00,-35.83)"><circle cx="34.8573" cy="37.8058" r="14.1942" fill="none" stroke="#F3F1FF" stroke-width="2.4" opacity=".95"/><line x1="8" y1="52" x2="56" y2="52" stroke="#4FD8E8" stroke-width="5.4" stroke-linecap="round"/><line x1="56" y1="52" x2="38" y2="8" stroke="#FF6B8B" stroke-width="5.4" stroke-linecap="round"/><line x1="38" y1="8" x2="8" y2="52" stroke="#FFC53D" stroke-width="5.4" stroke-linecap="round"/><circle cx="34.86" cy="52.00" r="2.6" fill="#F3F1FF" stroke="#15173B" stroke-width="1.2"/><circle cx="47.99" cy="32.43" r="2.6" fill="#F3F1FF" stroke="#15173B" stroke-width="1.2"/><circle cx="23.13" cy="29.81" r="2.6" fill="#F3F1FF" stroke="#15173B" stroke-width="1.2"/></g></svg>';
  var GROUPS=[
    {label:'Home', href:'index.html'},
    {label:'Practise', items:[
      {href:'drill.html', name:'Drill', note:'Full papers, timed, with extra-time options'},
      {href:'arena.html', name:'Arena', note:'Race a bot to the right answer'},
      {href:'review.html', name:'Review mistakes', note:'Wrong answers return after 1, 3 and 7 days'},
      {href:'duel.html', name:'Friend duel', note:'Five questions; your friend races your ghost'},
      {href:'qotw.html', name:'Problem of the week', note:'One hard problem, discussion unlocks when you answer'},
      {href:'bank.html', name:'Question bank', note:'Every question, rated 4.5 to 9.0'},
      {href:'interviews.html', name:'Mock interviews', note:'Twenty-five minutes, one problem'},
      {href:'marker.html', name:'Proof marker', note:'Get a written solution marked'}]},
    {label:'Explore', items:[
      {href:'geometry.html', name:'Geometry Lab', note:'Triangle centres you can drag'},
      {href:'sandbox.html', name:'Conjecture sandbox', note:'Build a figure, find what stays true'},
      {href:'techniques.html', name:'Technique index', note:'Questions filed by method'}]},
    {label:'Progress', items:[
      {href:'rewards.html', name:'Rewards', note:'Levels, badges, quests and the daily challenge'},
      {href:'progress.html', name:'My progress', note:'Accuracy, timing and streaks'},
      {href:'results.html', name:'Results', note:'Your scores against everyone else'}]},
    {label:'Music', href:'music.html'}
  ];
  var here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  function caret(){return '<svg class="caret" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';}
  function build(nav){
    var h='<div class="bar"><a class="brand" href="index.html">'+LOGO+'<span>Kevinvariant</span></a>'
      +'<button class="toggle" type="button" aria-expanded="false" aria-controls="navlinks">Menu</button><ul class="links" id="navlinks">';
    GROUPS.forEach(function(g,i){
      if(g.href){ h+='<li><a href="'+g.href+'"'+(g.href===here?' aria-current="page"':'')+'>'+g.label+'</a></li>'; return; }
      var cur=g.items.some(function(it){return it.href===here;});
      h+='<li><button type="button" class="'+(cur?'current':'')+'" aria-expanded="false" aria-controls="m'+i+'">'+g.label+caret()+'</button><ul class="menu" id="m'+i+'">'
        +g.items.map(function(it){return '<li><a href="'+it.href+'"'+(it.href===here?' aria-current="page"':'')+'>'+it.name+'<small>'+it.note+'</small></a></li>';}).join('')+'</ul></li>';
    });
    nav.innerHTML=h+'</ul></div>';
    nav.classList.add('site-nav'); nav.setAttribute('aria-label','Site');
    var menus=nav.querySelectorAll('.links>li>button');
    function closeAll(except){ menus.forEach(function(b){ if(b!==except){ b.setAttribute('aria-expanded','false'); document.getElementById(b.getAttribute('aria-controls')).classList.remove('open'); } }); }
    menus.forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var open=b.getAttribute('aria-expanded')!=='true'; closeAll(b); b.setAttribute('aria-expanded',String(open)); document.getElementById(b.getAttribute('aria-controls')).classList.toggle('open',open); }); });
    document.addEventListener('click',function(){ closeAll(null); nav.querySelectorAll('.acct .menu.open').forEach(function(m){ m.classList.remove('open'); var b=m.previousElementSibling; if(b) b.setAttribute('aria-expanded','false'); }); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeAll(null); });
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
      li.innerHTML='<button type="button" class="who" aria-expanded="false" aria-controls="macct"><span class="av">'+esc(init)+'</span><span class="nm">'+esc(name.split('@')[0])+'</span>'+caret()+'</button>'
        +'<ul class="menu right" id="macct"><li class="me">'+esc(u.email||'')+'</li><li><a href="account.html"'+(here==='account.html'?' aria-current="page"':'')+'>Your account<small>Profile, password and synced progress</small></a></li><li><a href="progress.html">My progress<small>Synced across your devices</small></a></li><li><button type="button" class="out">Sign out</button></li></ul>';
      var b=li.querySelector('.who'), m=li.querySelector('.menu');
      b.addEventListener('click',function(e){ e.stopPropagation(); var o=b.getAttribute('aria-expanded')!=='true'; nav.querySelectorAll('.menu.open').forEach(function(x){ if(x!==m){ x.classList.remove('open'); } }); b.setAttribute('aria-expanded',String(o)); m.classList.toggle('open',o); });
      li.querySelector('.out').addEventListener('click',async function(){ this.disabled=true; this.textContent='Signing out'; await window.HU_AUTH.signOut(); location.href='auth.html?signedout=1'; });
    }
    window.addEventListener('hu-auth-ready',function(){ window.HU_AUTH.onChange(paint); });
    if(window.HU_AUTH) window.HU_AUTH.onChange(paint);
  }
  function loadRewards(){ if(window.HU_REWARDS) return; var sc=document.createElement('script'); sc.src='rewards.js?v=20260926'; sc.defer=true; document.head.appendChild(sc); }
  function loadAccounts(){
    if(window.HU_AUTH) return;
    loadScript('auth-config.js?v=20260926').catch(function(){}).then(function(){
      var c=window.HU_AUTH_CONFIG||{};
      var lib=(c.url&&c.anonKey)?loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js').catch(function(){}):Promise.resolve();
      return lib.then(function(){ return loadScript('account.js?v=20260926'); });
    }).catch(function(){});
  }
  function init(){
    document.body.setAttribute('data-theme-v2','');
    var nav=document.getElementById('sitenav')||document.querySelector('body>nav');
    if(nav){ build(nav); accountSlot(nav); }
    loadAccounts(); loadRewards();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
