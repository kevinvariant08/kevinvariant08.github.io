/* Kevinvariant rewards engine. Loaded on every page by site.js.
   Everything is computed from data the site already records (the answer log,
   timed papers, Arena history), and experience is banked per day so that
   nothing earned is ever lost when older log entries are trimmed. */
(function(){
  if(window.HU_REWARDS) return;
  var RATING={"C2-7":4.5,"D1-1":4.5,"D2-1":4.5,"D2-2":4.5,"E1-1":4.5,"E2-1":4.5,"B2-7":4.6,"D1-2":4.6,"D2-3":4.6,"E2-2":4.6,"F1-1":4.6,"C1-1":4.7,"D2-4":4.7,"B1-12":4.8,"C1-4":4.8,"D1-3":4.8,"E1-2":4.8,"E1-3":4.8,"E2-3":4.8,"F1-2":4.8,"F1-3":4.8,"F2-1":4.8,"F2-2":4.8,"B1-10":4.9,"C2-10":4.9,"C1-5":5,"D1-4":5,"E1-4":5,"E2-4":5,"E2-5":5,"E2-6":5,"F1-4":5,"F2-3":5,"B1-17":5.1,"C2-9":5.1,"C2-1":5.2,"D1-5":5.2,"D1-6":5.2,"D2-5":5.2,"D2-6":5.2,"D2-7":5.2,"E1-5":5.2,"E1-6":5.2,"E2-7":5.2,"E2-8":5.2,"F1-5":5.2,"F1-6":5.2,"F2-4":5.2,"F2-5":5.2,"B1-6":5.3,"B2-3":5.3,"C1-3":5.3,"C2-2":5.3,"B2-2":5.4,"D2-8":5.4,"E1-7":5.4,"E2-10":5.4,"E2-9":5.4,"F1-7":5.4,"F2-6":5.4,"F2-7":5.4,"B2-16":5.5,"D1-7":5.5,"D1-8":5.5,"D2-9":5.5,"E2-11":5.5,"B1-13":5.6,"C2-12":5.6,"D1-9":5.6,"D2-10":5.6,"E1-8":5.6,"E1-9":5.6,"E2-12":5.6,"F1-8":5.6,"F1-9":5.6,"F2-8":5.6,"F2-9":5.6,"B2-12":5.7,"D1-10":5.7,"D2-11":5.7,"E1-10":5.7,"E2-13":5.7,"F1-10":5.7,"B1-8":5.8,"B2-1":5.8,"C2-5":5.8,"D1-11":5.8,"D2-12":5.8,"E1-11":5.8,"E1-12":5.8,"E1-13":5.8,"E1-14":5.8,"E2-14":5.8,"F1-11":5.8,"F1-12":5.8,"F1-13":5.8,"F2-10":5.8,"F2-11":5.8,"B1-2":5.9,"B2-4":5.9,"C1-12":5.9,"C2-19":5.9,"C1-2":6,"C2-14":6,"D1-12":6,"D1-13":6,"D2-13":6,"E1-15":6,"E1-16":6,"E2-15":6,"F1-14":6,"F1-15":6,"F2-12":6,"F2-13":6,"F2-14":6,"F2-15":6,"B1-16":6.1,"C2-8":6.1,"B1-14":6.2,"C1-16":6.2,"C2-4":6.2,"D1-14":6.2,"D1-15":6.2,"D2-14":6.2,"D2-15":6.2,"D2-16":6.2,"E1-17":6.2,"E2-16":6.2,"F1-16":6.2,"F1-17":6.2,"F1-18":6.2,"F2-16":6.2,"F2-17":6.2,"B2-5":6.3,"C1-19":6.3,"B1-19":6.4,"C1-10":6.4,"C2-11":6.4,"D1-16":6.4,"D1-17":6.4,"E2-17":6.4,"E2-18":6.4,"F1-19":6.4,"F2-18":6.4,"B1-20":6.5,"B2-14":6.5,"B2-20":6.5,"C1-14":6.5,"C2-6":6.5,"D2-17":6.5,"E1-18":6.5,"B2-9":6.6,"C1-6":6.6,"C2-17":6.6,"D2-18":6.6,"E1-19":6.6,"E2-19":6.6,"F2-19":6.6,"B2-11":6.7,"C2-3":6.7,"B1-11":6.8,"C1-9":6.8,"C2-13":6.8,"D1-18":6.8,"H2-1":6.8,"H2-2":6.8,"B2-8":6.9,"C1-15":6.9,"B1-18":7,"B2-15":7,"C1-11":7,"D2-19":7,"G1-1":7,"G1-2":7,"G2-1":7,"G2-2":7,"G2-3":7,"H2-3":7,"H2-4":7,"B1-5":7.1,"C1-13":7.1,"C1-7":7.2,"D1-19":7.2,"E2-20":7.2,"F1-20":7.2,"G1-3":7.2,"G1-4":7.2,"G2-4":7.2,"G2-5":7.2,"H1-1":7.2,"H1-2":7.2,"H1-3":7.2,"H1-4":7.2,"H2-5":7.2,"H2-6":7.2,"H2-7":7.2,"H2-8":7.2,"B1-7":7.3,"C2-15":7.3,"B2-13":7.4,"D1-20":7.4,"F2-20":7.4,"G1-5":7.4,"G1-6":7.4,"G1-7":7.4,"G2-6":7.4,"G2-7":7.4,"G2-8":7.4,"G2-9":7.4,"H1-5":7.4,"H1-6":7.4,"H1-7":7.4,"H2-10":7.4,"H2-11":7.4,"H2-12":7.4,"H2-9":7.4,"B1-1":7.5,"C1-20":7.5,"E1-20":7.5,"B1-15":7.6,"C1-8":7.6,"C2-16":7.6,"D2-20":7.6,"G1-10":7.6,"G1-8":7.6,"G1-9":7.6,"G2-10":7.6,"G2-11":7.6,"G2-12":7.6,"H1-10":7.6,"H1-11":7.6,"H1-8":7.6,"H1-9":7.6,"H2-13":7.6,"H2-14":7.6,"C1-17":7.7,"B2-6":7.8,"G1-11":7.8,"G1-12":7.8,"G1-13":7.8,"G2-13":7.8,"G2-14":7.8,"G2-15":7.8,"H1-12":7.8,"H1-13":7.8,"H1-14":7.8,"H1-15":7.8,"H1-16":7.8,"H2-15":7.8,"H2-16":7.8,"H2-17":7.8,"C2-20":7.9,"B2-10":8,"G1-14":8,"G1-15":8,"G1-16":8,"G2-16":8,"G2-17":8,"H1-17":8,"H1-18":8,"H2-18":8,"H2-19":8,"B1-3":8.2,"B2-17":8.2,"G1-17":8.2,"G2-18":8.2,"H1-19":8.2,"H2-20":8.2,"B1-4":8.3,"C2-18":8.4,"G1-18":8.4,"G1-19":8.4,"G2-19":8.4,"H1-20":8.4,"B1-9":8.6,"G2-20":8.6,"C1-18":8.7,"B2-19":8.8,"G1-20":8.8,"B2-18":9};
  var DAY=86400000, LAUNCH='2026-09-25';
  function load(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
  function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function pad(n){ return (n<10?'0':'')+n; }
  function dkey(t){ var d=new Date(t); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function today(){ return dkey(Date.now()); }
  function shift(k,n){ var p=k.split('-'), d=new Date(+p[0],p[1]-1,+p[2]+n); return dkey(d.getTime()); }
  function weekStart(k){ var p=k.split('-'), d=new Date(+p[0],p[1]-1,+p[2]); var wd=(d.getDay()+6)%7; return shift(k,-wd); }
  function hash(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  /* ---------------- experience rules */
  function rating(id){ return RATING[id]||6; }
  function answerXP(e){ return e.correct?Math.round(rating(e.id)*2):2; }
  function paperXP(a){ return 50+5*(a.score||0); }
  function duelXP(h){ return h.you>h.them?40:(h.you===h.them?20:10); }
  var XP_RULES=[['Correct answer','twice the question\u2019s rating (9 to 18)'],['Wrong answer','2, for the attempt'],['Finishing a timed paper','50, plus 5 per mark'],['Arena duel','40 for a win, 20 for a draw, 10 for a loss'],['Daily challenge','60 if correct plus 5 per streak day (up to 50), 15 if not'],['Weekly quest','150 to 250 each'],['Friend duel','40 for a win, 20 for a draw, 10 for a loss, 15 for sending a challenge'],['Problem of the week','100 if solved, 25 for an attempt'],['Mistake review','the usual answer XP for each review']];

  /* ---------------- levels: need(n) = 50 n (n-1) */
  var TITLES=['Point','Segment','Ray','Angle','Triangle','Median','Centroid','Incircle','Circumcircle','Orthocentre','Euler Line','Nine-Point Circle','Feuerbach Point','Symmedian','Brocard Point','Excircle','Mixtilinear Circle','Isogonal Conjugate','Simson Line','Morley Triangle','Poncelet Porism','Radical Axis','Pole and Polar','Inversion','Invariant'];
  function need(n){ return 50*n*(n-1); }
  function levelOf(xp){ var n=1; while(need(n+1)<=xp) n++; return n; }
  function titleOf(n){ return n<=25?TITLES[n-1]:'Invariant '+(n-24); }

  /* ---------------- themes unlocked by level */
  var THEMES=[
    {id:'indigo',name:'Indigo',lvl:1,v:{}},
    {id:'ember',name:'Ember',lvl:4,v:{'--aqua':'#FFB86B','--rose':'#FF5F6D','--saffron':'#FFD166'}},
    {id:'aurora',name:'Aurora',lvl:7,v:{'--aqua':'#7CF5D8','--rose':'#B38CFF','--saffron':'#9BE8FF'}},
    {id:'sakura',name:'Sakura',lvl:10,v:{'--aqua':'#9AD8FF','--rose':'#FF8FB8','--saffron':'#FFE3A3'}},
    {id:'royal',name:'Royal',lvl:14,v:{'--aqua':'#A3B8FF','--rose':'#C38BFF','--saffron':'#FFD36E','--bg':'#120F33','--surface':'#1B1648'}},
    {id:'invariant',name:'Invariant Gold',lvl:20,v:{'--aqua':'#FFE08A','--rose':'#FFB347','--saffron':'#FFF3C4','--bg':'#17130A','--surface':'#221B0E','--surface-2':'#2C2312','--line':'#4A3C1E'}}];
  function applyTheme(id){ var t=THEMES.filter(function(x){return x.id===id;})[0]||THEMES[0], root=document.documentElement;
    THEMES.forEach(function(x){ Object.keys(x.v).forEach(function(k){ root.style.removeProperty(k); }); });
    Object.keys(t.v).forEach(function(k){ root.style.setProperty(k,t.v[k]); }); }

  /* ---------------- stored state (synced by account.js) */
  function state(){ var R=load('hu_rewards',{}); R.bank=R.bank||{}; R.daily=R.daily||{}; R.claimed=R.claimed||{}; R.frozen=R.frozen||[]; R.milestones=R.milestones||[]; R.theme=R.theme||'indigo'; return R; }

  function snapshot(){
    var R=state(), L=load('hu_drill_log',[]), A=load('hu_drill_attempts',[]), AR=load('hu_arena',{rating:1200,history:[]}), IV=load('hu_iv_hist',[]), LB=load('hu_ladder_best',0);
    // bank experience by day: the stored value never goes down
    var days={};
    L.forEach(function(e){ var k=dkey(e.t); days[k]=(days[k]||0)+answerXP(e); });
    A.forEach(function(a){ if(a.date) days[a.date]=(days[a.date]||0)+paperXP(a); });
    (AR.history||[]).forEach(function(h){ var k=dkey(h.t); days[k]=(days[k]||0)+duelXP(h); });
    load('hu_duels',[]).forEach(function(h){ var k=dkey(h.t); days[k]=(days[k]||0)+(h.opp?(h.res==='win'?40:h.res==='draw'?20:10):15); });
    var QW=load('hu_qotw',{}); Object.keys(QW).forEach(function(w){ var e=QW[w]; if(e&&e.t&&!e.gaveUp){ var k=dkey(e.t); days[k]=(days[k]||0)+(e.ok?100:25); } });
    Object.keys(days).forEach(function(k){ R.bank[k]=Math.max(R.bank[k]||0,days[k]); });
    R.maxAnswers=Math.max(R.maxAnswers||0,L.length);
    var bonus={};
    Object.keys(R.daily).forEach(function(k){ bonus[k]=(bonus[k]||0)+(R.daily[k].xp||0); });
    Object.keys(R.claimed).forEach(function(q){ var c=R.claimed[q]; bonus[c.day]=(bonus[c.day]||0)+(c.xp||0); });
    var xp=0, perDay={};
    Object.keys(R.bank).forEach(function(k){ perDay[k]=(perDay[k]||0)+R.bank[k]; });
    Object.keys(bonus).forEach(function(k){ perDay[k]=(perDay[k]||0)+bonus[k]; });
    Object.keys(perDay).forEach(function(k){ xp+=perDay[k]; });
    // streaks with freezes: one freeze earned per 7 days of streak, at most 2 held
    var active={}; Object.keys(perDay).forEach(function(k){ if(perDay[k]>0) active[k]=1; }); R.frozen.forEach(function(k){ active[k]=1; });
    var t=today(), start=active[t]?t:shift(t,-1), streak=0, d=start, used=R.frozen.length, earned=R.milestones.length;
    var firstDay=Object.keys(active).sort()[0]||t;
    while(true){
      if(active[d]){ streak++; d=shift(d,-1); continue; }
      if(d<firstDay) break;
      var gap=[], g=d; while(!active[g]&&g>=firstDay&&gap.length<3){ gap.push(g); g=shift(g,-1); }
      var left=Math.min(2,earned-used);
      if(active[g]&&gap.length<=left){ gap.forEach(function(x){ R.frozen.push(x); active[x]=1; }); used+=gap.length; continue; }
      break;
    }
    for(var m=7;m<=streak;m+=7){ if(R.milestones.indexOf(m)<0) R.milestones.push(m); }
    var best=0, run=0, keys=Object.keys(active).sort(), prev=null;
    keys.forEach(function(k){ run=(prev&&shift(prev,1)===k)?run+1:1; best=Math.max(best,run); prev=k; });
    var freezes=Math.max(0,Math.min(2,R.milestones.length-R.frozen.length));
    var ws=weekStart(t), weekXP=0; Object.keys(perDay).forEach(function(k){ if(k>=ws) weekXP+=perDay[k]; });
    save('hu_rewards',R);
    var lvl=levelOf(xp);
    return {R:R,L:L,A:A,AR:AR,IV:IV,LB:LB,xp:xp,level:lvl,title:titleOf(lvl),next:need(lvl+1),cur:need(lvl),perDay:perDay,streak:streak,best:best,freezes:freezes,weekXP:weekXP,week:ws,today:t};
  }

  /* ---------------- badges */
  function streakRun(L,filter){ var b=0,r=0; L.forEach(function(e){ if(filter&&!filter(e)) return; r=e.correct?r+1:0; b=Math.max(b,r); }); return b; }
  var PAPERS=[]; Object.keys(RATING).forEach(function(id){ var p=id.split('-')[0]; if(PAPERS.indexOf(p)<0) PAPERS.push(p); });
  var BADGES=[
    {id:'first',name:'First Point',tier:0,d:'Answer your first question.',f:function(s){return s.L.length>0||s.R.maxAnswers>0;}},
    {id:'century',name:'Century',tier:1,d:'Answer 100 questions.',f:function(s){return s.R.maxAnswers>=100;}},
    {id:'thousand',name:'A Thousand Cuts',tier:2,d:'Answer 1000 questions.',f:function(s){return s.R.maxAnswers>=1000;}},
    {id:'chain',name:'Unbroken Chain',tier:1,d:'Get 10 answers right in a row.',f:function(s){return streakRun(s.L)>=10;}},
    {id:'deep',name:'Deep End',tier:1,d:'Get 10 questions rated 8 or above right.',f:function(s){return s.L.filter(function(e){return e.correct&&rating(e.id)>=8;}).length>=10;}},
    {id:'lightning',name:'Lightning Proof',tier:2,d:'Get a question rated 8 or above right in under 90 seconds.',f:function(s){return s.L.some(function(e){return e.correct&&rating(e.id)>=8&&e.secs<90;});}},
    {id:'ninepoint',name:'Nine Point Oh',tier:2,d:'Solve the single hardest question on the site.',f:function(s){var top=Object.keys(RATING).reduce(function(a,b){return RATING[a]>=RATING[b]?a:b;}); return s.L.some(function(e){return e.correct&&e.id===top;});}},
    {id:'clean',name:'Clean Sheet',tier:2,d:'Score 20 out of 20 on a timed paper.',f:function(s){return s.A.some(function(a){return a.score>=20;});}},
    {id:'spare',name:'Time to Spare',tier:1,d:'Score 15 or more on a standard-time paper in under an hour.',f:function(s){return s.A.some(function(a){return a.score>=15&&a.secs<=3600&&(a.timing||4500)===4500;});}},
    {id:'perfect',name:'Paper Perfect',tier:2,d:'Over any number of sittings, answer every question of one paper correctly.',f:function(s){var ok={}; s.L.forEach(function(e){ if(e.correct) ok[e.id]=1; }); return PAPERS.some(function(p){ for(var i=1;i<=20;i++) if(!ok[p+'-'+i]) return false; return true; });}},
    {id:'collector',name:'Set Collector',tier:1,d:'Answer a question from every paper on the site.',f:function(s){var seen={}; s.L.forEach(function(e){ seen[e.paper]=1; }); return PAPERS.every(function(p){return seen[p];});}},
    {id:'polymath',name:'Polymath',tier:1,d:'Get questions right in 15 different techniques.',f:function(s){var t={}; s.L.forEach(function(e){ if(e.correct)(e.tags||[]).forEach(function(x){t[x]=1;}); }); return Object.keys(t).length>=15;}},
    {id:'slayer',name:'Giant Slayer',tier:2,d:'Beat the Olympian bot in an Arena duel.',f:function(s){return (s.AR.history||[]).some(function(h){return /olympian/i.test(h.bot)&&h.you>h.them;});}},
    {id:'contender',name:'Contender',tier:0,d:'Reach an Arena rating of 1400.',f:function(s){return (s.AR.best||s.AR.rating||0)>=1400;}},
    {id:'challenger',name:'Challenger',tier:1,d:'Reach an Arena rating of 1600.',f:function(s){return (s.AR.best||s.AR.rating||0)>=1600;}},
    {id:'grandmaster',name:'Grandmaster',tier:2,d:'Reach an Arena rating of 1800.',f:function(s){return (s.AR.best||s.AR.rating||0)>=1800;}},
    {id:'rung',name:'Rung Runner',tier:0,d:'Score 1000 in a ten-minute ladder.',f:function(s){return s.LB>=1000;}},
    {id:'summit',name:'Summit',tier:2,d:'Score 2500 in a ten-minute ladder.',f:function(s){return s.LB>=2500;}},
    {id:'three',name:'Three in a Row',tier:0,d:'Practise on 3 days running.',f:function(s){return s.best>=3;}},
    {id:'week',name:'Week of Wonders',tier:1,d:'Practise on 7 days running.',f:function(s){return s.best>=7;}},
    {id:'month',name:'Month of Maths',tier:2,d:'Practise on 30 days running.',f:function(s){return s.best>=30;}},
    {id:'devotee',name:'Daily Devotee',tier:1,d:'Solve 7 daily challenges.',f:function(s){return Object.keys(s.R.daily).filter(function(k){return s.R.daily[k].ok;}).length>=7;}},
    {id:'owl',name:'Night Owl',tier:0,d:'Get a question right between midnight and 5am.',f:function(s){return s.L.some(function(e){return e.correct&&new Date(e.t).getHours()<5;});}},
    {id:'viva',name:'Viva Survivor',tier:1,d:'Finish a mock interview.',f:function(s){return s.IV.length>0;}},
    {id:'rival',name:'Friendly Rival',tier:1,d:'Win a duel against a friend.',f:function(){return load('hu_duels',[]).some(function(h){return h.opp&&h.res==='win';});}},
    {id:'weekly',name:'Problem Solver',tier:2,d:'Solve four problems of the week.',f:function(){var QW=load('hu_qotw',{}); return Object.keys(QW).filter(function(w){return QW[w]&&QW[w].ok;}).length>=4;}},
    {id:'second',name:'Second Chance',tier:1,d:'Master 10 questions from your mistake review queue.',f:function(){var S=load('hu_review',{}),I=S.items||{}; return Object.keys(I).filter(function(k){return I[k].mastered;}).length>=10;}}];
  var TIER=['Bronze','Silver','Gold'], TIERCOL=['var(--aqua)','var(--rose)','var(--saffron)'];
  function earnedBadges(s){ return BADGES.filter(function(b){ try{ return b.f(s); }catch(e){ return false; } }).map(function(b){return b.id;}); }
  function medal(b,got,size){ size=size||64; var c=got?TIERCOL[b.tier]:'#4A4E8C', f=got?'#F3F1FF':'#4A4E8C';
    return '<svg viewBox="0 0 64 64" width="'+size+'" height="'+size+'" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="'+(got?'rgba(255,255,255,.04)':'none')+'" stroke="'+c+'" stroke-width="2" stroke-dasharray="'+(got?'0':'3 4')+'"/>'
      +'<path d="M14 45 L50 45 L36 13 Z" fill="none" stroke="'+c+'" stroke-width="3.2" stroke-linejoin="round"/><circle cx="34" cy="35.5" r="8.4" fill="none" stroke="'+f+'" stroke-width="1.8" opacity="'+(got?.95:.5)+'"/>'
      +(got?'<circle cx="34" cy="45" r="2" fill="#F3F1FF"/><circle cx="41.9" cy="31.6" r="2" fill="#F3F1FF"/><circle cx="26.2" cy="30.3" r="2" fill="#F3F1FF"/>':'')+'</svg>'; }

  /* ---------------- weekly quests: three per week, the same for everyone */
  var QUESTS=[
    {id:'answers',name:'Answer 30 questions',xp:150,goal:30,f:function(w){return w.L.length;}},
    {id:'hard',name:'Get 8 questions rated 7.5 or above right',xp:200,goal:8,f:function(w){return w.L.filter(function(e){return e.correct&&rating(e.id)>=7.5;}).length;}},
    {id:'duels',name:'Win 3 Arena duels',xp:150,goal:3,f:function(w){return w.H.filter(function(h){return h.you>h.them;}).length;}},
    {id:'paper',name:'Complete a timed paper',xp:200,goal:1,f:function(w){return w.A.length;}},
    {id:'daily',name:'Solve the daily challenge on 4 days',xp:200,goal:4,f:function(w){return w.D.filter(function(d){return d.ok;}).length;}},
    {id:'days',name:'Practise on 5 different days',xp:150,goal:5,f:function(w){var s={}; w.L.forEach(function(e){s[dkey(e.t)]=1;}); return Object.keys(s).length;}},
    {id:'run',name:'Get 10 answers right in a row',xp:250,goal:10,f:function(w){return streakRun(w.L);}},
    {id:'breadth',name:'Get questions right in 6 different techniques',xp:150,goal:6,f:function(w){var t={}; w.L.forEach(function(e){ if(e.correct)(e.tags||[]).forEach(function(x){t[x]=1;}); }); return Object.keys(t).length;}}];
  function weekQuests(s){ var ws=s.week, h=hash('week'+ws), pool=QUESTS.slice(), out=[];
    while(out.length<3){ var i=h%pool.length; out.push(pool.splice(i,1)[0]); h=hash(String(h)); }
    var t0=new Date(ws.split('-')[0],ws.split('-')[1]-1,ws.split('-')[2]).getTime();
    var w={L:s.L.filter(function(e){return e.t>=t0;}),H:(s.AR.history||[]).filter(function(h){return h.t>=t0;}),A:s.A.filter(function(a){return a.date>=ws;}),D:Object.keys(s.R.daily).filter(function(k){return k>=ws;}).map(function(k){return s.R.daily[k];})};
    return out.map(function(q){ var key=ws+':'+q.id, p=Math.min(q.goal,q.f(w)); return {q:q,key:key,progress:p,done:p>=q.goal,claimed:!!s.R.claimed[key]}; }); }
  function claim(key,xp){ var R=state(); if(R.claimed[key]) return; R.claimed[key]={xp:xp,day:today()}; save('hu_rewards',R); tick(); }

  /* ---------------- daily challenge: the same question for everyone each day */
  function dailyId(k){ var pool=Object.keys(RATING).filter(function(id){return RATING[id]>=6.5;}).sort(); return pool[hash('daily'+k)%pool.length]; }
  function dailyNumber(k){ var a=new Date(LAUNCH), p=k.split('-'), b=new Date(+p[0],p[1]-1,+p[2]); return Math.round((b-a)/DAY)+1; }
  function recordDaily(ok,secs,id,chosen,tags){ var R=state(), k=today(); if(R.daily[k]) return R.daily[k];
    var s=snapshot(), xp=ok?60+5*Math.min(10,s.streak+1):15; R=state(); R.daily[k]={ok:ok,secs:Math.round(secs),xp:xp,id:id}; save('hu_rewards',R);
    var L=load('hu_drill_log',[]); L.push({t:Date.now(),id:id,paper:id.split('-')[0],correct:ok,chosen:chosen||null,secs:Math.round(secs),mode:'daily',tags:tags||[]}); save('hu_drill_log',L.slice(-2000));
    tick(); return R.daily[k]; }


  /* ---------------- mistake review queue: back after 1, 3 and 7 days; clearing the 7-day review masters it */
  var GAPS=[1,3,7];
  function reviewState(){ var S=load('hu_review',{}); S.items=S.items||{}; S.upto=S.upto||0; return S; }
  function reviewSync(){ var S=reviewState(), L=load('hu_drill_log',[]), changed=false;
    L.forEach(function(e){ if(e.t<=S.upto||e.mode==='review'||e.correct||!RATING[e.id]) return;
      var old=S.items[e.id]||{}; S.items[e.id]={stage:0,due:shift(dkey(e.t),1),added:old.added||e.t,last:e.t,mastered:false,misses:(old.misses||0)+1}; changed=true; });
    if(L.length&&L[L.length-1].t>S.upto){ S.upto=L[L.length-1].t; changed=true; }
    if(changed) save('hu_review',S); return S; }
  function reviewDue(){ var S=reviewSync(), t=today();
    return Object.keys(S.items).filter(function(id){ var it=S.items[id]; return !it.mastered&&it.due<=t; })
      .sort(function(a,b){ return S.items[a].due<S.items[b].due?-1:S.items[a].due>S.items[b].due?1:rating(a)-rating(b); }); }
  function reviewRecord(id,ok,chosen,secs,tags){ var S=reviewSync(), it=S.items[id]; if(!it) return null; var t=today();
    if(ok){ if(it.stage>=GAPS.length-1){ it.mastered=true; it.masteredAt=Date.now(); } else { it.stage++; it.due=shift(t,GAPS[it.stage]); } }
    else { it.stage=0; it.due=shift(t,1); it.misses=(it.misses||0)+1; }
    it.last=Date.now(); S.items[id]=it;
    var L=load('hu_drill_log',[]); L.push({t:Date.now(),id:id,paper:id.split('-')[0],correct:ok,chosen:chosen,secs:Math.round(secs),mode:'review',tags:tags||[]}); save('hu_drill_log',L.slice(-2000));
    S.upto=Math.max(S.upto,Date.now()); save('hu_review',S); tick(); return it; }
  /* ---------------- on-page feedback */
  var css='.rw-toasts{position:fixed;right:1rem;bottom:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;align-items:flex-end;pointer-events:none}'
   +'.rw-toast{pointer-events:auto;display:flex;align-items:center;gap:.7rem;background:var(--surface-2,#252964);border:1px solid var(--line,#343A82);border-radius:14px;padding:.6rem .9rem;color:var(--ink,#F3F1FF);font:600 .92rem var(--display,system-ui);box-shadow:0 10px 30px rgba(0,0,0,.35);animation:rwIn .35s ease-out}'
   +'.rw-toast small{display:block;font-weight:500;color:var(--ink-soft,#BDBBE6);font-size:.8rem}.rw-toast.xp{padding:.4rem .75rem;font-size:.85rem}.rw-toast.xp b{color:var(--saffron,#FFC53D)}'
   +'@keyframes rwIn{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}'
   +'.site-nav .links a.rw-pill{display:inline-flex;align-items:center;gap:.4rem;padding:.3rem .65rem;min-height:0;border-radius:999px;border:1px solid var(--line,#343A82);color:var(--ink,#F3F1FF);text-decoration:none;font:600 .85rem var(--display,system-ui);white-space:nowrap}'
   +'.site-nav .links a.rw-pill:hover{background:var(--surface-2,#252964)}.site-nav .links a.rw-pill.rv{border-color:var(--rose,#FF6B8B);color:var(--rose,#FF6B8B)}.site-nav .rw{display:flex;gap:.35rem;align-items:center}.site-nav .links a.rw-pill .lv{color:var(--saffron,#FFC53D)}.site-nav .links a.rw-pill svg{width:14px;height:14px}'
   +'.rw-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(10,11,35,.72);animation:rwIn .3s}'
   +'.rw-modal .card{background:var(--surface,#1D2052);border:1px solid var(--line,#343A82);border-radius:22px;padding:2rem 2.2rem;text-align:center;max-width:24rem;color:var(--ink,#F3F1FF)}'
   +'.rw-modal h2{font:800 1.9rem var(--display,system-ui);margin:.4rem 0 .2rem}.rw-modal p{color:var(--ink-soft,#BDBBE6);margin:.3rem 0 1rem}'
   +'.rw-modal button{font:700 1rem var(--display,system-ui);background:var(--rose,#FF6B8B);color:#15173B;border:0;border-radius:999px;padding:.65rem 1.4rem;cursor:pointer}'
   +'.rw-conf{position:fixed;inset:0;pointer-events:none;z-index:10001}';
  function inject(){ if(document.getElementById('rw-css')) return; var st=document.createElement('style'); st.id='rw-css'; st.textContent=css; document.head.appendChild(st);
    var box=document.createElement('div'); box.className='rw-toasts'; box.id='rw-toasts'; box.setAttribute('aria-live','polite'); document.body.appendChild(box); }
  function toast(html,cls,ms){ var box=document.getElementById('rw-toasts'); if(!box) return; var el=document.createElement('div'); el.className='rw-toast '+(cls||''); el.innerHTML=html; box.appendChild(el);
    setTimeout(function(){ el.style.transition='opacity .4s'; el.style.opacity='0'; setTimeout(function(){ el.remove(); },450); },ms||3200); }
  function confetti(){ var c=document.createElement('canvas'); c.className='rw-conf'; c.width=innerWidth; c.height=innerHeight; document.body.appendChild(c);
    var g=c.getContext('2d'), cols=['#4FD8E8','#FF6B8B','#FFC53D','#5BE3A6','#F3F1FF'], P=[];
    for(var i=0;i<160;i++) P.push({x:innerWidth/2,y:innerHeight/2.4,vx:(Math.random()-.5)*14,vy:-Math.random()*13-3,s:4+Math.random()*5,c:cols[i%5],r:Math.random()*6});
    var f=0; (function step(){ g.clearRect(0,0,c.width,c.height); P.forEach(function(p){ p.vy+=.35; p.x+=p.vx; p.y+=p.vy; p.r+=.2; g.save(); g.translate(p.x,p.y); g.rotate(p.r); g.fillStyle=p.c; g.beginPath(); g.moveTo(0,-p.s); g.lineTo(p.s*.9,p.s*.6); g.lineTo(-p.s*.9,p.s*.6); g.closePath(); g.fill(); g.restore(); });
      if(++f<150) requestAnimationFrame(step); else c.remove(); })(); }
  function levelUp(s){ var unlocked=THEMES.filter(function(t){return t.lvl===s.level;})[0];
    var m=document.createElement('div'); m.className='rw-modal'; m.innerHTML='<div class="card" role="dialog" aria-label="Level up">'+medal({tier:2},true,72)+'<h2>Level '+s.level+'</h2><p>You are now a <strong>'+esc(s.title)+'</strong>.'+(unlocked?' The <strong>'+unlocked.name+'</strong> theme is unlocked.':'')+'</p><button type="button">Keep going</button></div>';
    document.body.appendChild(m); confetti(); m.querySelector('button').focus(); m.addEventListener('click',function(e){ if(e.target===m||e.target.tagName==='BUTTON') m.remove(); }); }
  var FLAME='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1.5.5 2.5 1.5 3C7.5 6 7 3.5 8 1z" fill="var(--rose,#FF6B8B)"/></svg>';
  function paintPill(s){ var li=document.querySelector('.site-nav .rw'); if(!li){ var ul=document.querySelector('.site-nav .links'); if(!ul) return; li=document.createElement('li'); li.className='rw'; var acct=ul.querySelector('.acct'); ul.insertBefore(li,acct||null); }
    var due=reviewDue().length;
    li.innerHTML=(due?'<a class="rw-pill rv" href="review.html" title="Mistakes due for review">'+due+' to review</a> ':'')+'<a class="rw-pill" href="rewards.html" title="'+esc(s.title)+', '+s.xp+' XP"><span class="lv">Lv '+s.level+'</span>'+(s.streak?FLAME+s.streak:'')+'</a>'; }

  /* ---------------- tick: recompute, notify, sync the leaderboard */
  var last=null, lbPushed=0;
  function tick(){ var s=snapshot(), got=earnedBadges(s), seen=load('hu_rewards_seen',null);
    if(!seen){ save('hu_rewards_seen',{xp:s.xp,level:s.level,badges:got}); seen=null; }
    else{
      if(s.xp>seen.xp&&s.xp-seen.xp<5000) toast('<span><b>+'+(s.xp-seen.xp)+' XP</b></span>','xp',1800);
      got.filter(function(b){return seen.badges.indexOf(b)<0;}).forEach(function(id){ var b=BADGES.filter(function(x){return x.id===id;})[0];
        toast(medal(b,true,38)+'<span>Badge unlocked: '+esc(b.name)+'<small>'+esc(b.d)+'</small></span>','',5200); });
      if(s.level>seen.level) levelUp(s);
      save('hu_rewards_seen',{xp:s.xp,level:s.level,badges:got});
    }
    paintPill(s); last=s; pushLeaderboard(s);
    window.dispatchEvent(new CustomEvent('hu-rewards',{detail:s})); return s; }
  function displayName(u){ var R=state(); if(R.lbName) return R.lbName; var m=u&&u.user_metadata||{}; return (m.display_name||m.name||(u&&u.email?u.email.split('@')[0]:'Player')).slice(0,24); }
  function pushLeaderboard(s){ var A=window.HU_AUTH, R=state(); if(!A||!A.configured||!A.user()||!R.lb) return; if(Date.now()-lbPushed<60000) return; lbPushed=Date.now();
    var u=A.user(); A.client.from('leaderboard').upsert({user_id:u.id,name:displayName(u),xp:s.xp,week_xp:s.weekXP,week:s.week,level:s.level,streak:s.streak,updated_at:new Date().toISOString()}).then(function(){}); }
  function setLeaderboard(on,name){ var R=state(); R.lb=!!on; if(name!=null) R.lbName=String(name).trim().slice(0,24); save('hu_rewards',R); lbPushed=0;
    var A=window.HU_AUTH; if(!on&&A&&A.configured&&A.user()) A.client.from('leaderboard').delete().eq('user_id',A.user().id).then(function(){}); tick(); }
  function fetchLeaderboard(weekly){ var A=window.HU_AUTH; if(!A||!A.configured) return Promise.resolve({error:'off'});
    var q=A.client.from('leaderboard').select('name,xp,week_xp,week,level,streak,user_id'); q=weekly?q.eq('week',weekStart(today())).order('week_xp',{ascending:false}):q.order('xp',{ascending:false});
    return q.limit(25).then(function(r){ return r.error?{error:r.error.message}:{rows:r.data}; }); }
  function setTheme(id){ var R=state(); R.theme=id; save('hu_rewards',R); applyTheme(id); }

  window.HU_REWARDS={snapshot:snapshot,tick:tick,BADGES:BADGES,TIER:TIER,TIERCOL:TIERCOL,medal:medal,THEMES:THEMES,setTheme:setTheme,weekQuests:weekQuests,claim:claim,
    dailyId:dailyId,dailyNumber:dailyNumber,recordDaily:recordDaily,earnedBadges:earnedBadges,titleOf:titleOf,need:need,XP_RULES:XP_RULES,rating:rating,
    setLeaderboard:setLeaderboard,fetchLeaderboard:fetchLeaderboard,displayName:displayName,dkey:dkey,shift:shift,today:today,esc:esc,FLAME:FLAME,
    review:{sync:reviewSync,due:reviewDue,record:reviewRecord,state:reviewState,GAPS:GAPS}};
  applyTheme(state().theme);
  function boot(){ inject(); tick(); setInterval(tick,4000); window.addEventListener('storage',function(e){ if(!e.key||e.key.indexOf('hu_')===0) tick(); }); window.addEventListener('hu-auth-event',function(){ setTimeout(tick,1500); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
