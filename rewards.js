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
    {id:'ember',name:'Ember',lvl:4,v:{'--aqua':'#FFB86B','--rose':'#FF5F6D','--saffron':'#FFD166','--bg':'#1C1014','--bg-deep':'#140A0D','--surface':'#2A161B','--surface-2':'#351C22','--line':'#57303A','--line-soft':'#44262E','--ink-soft':'#E8C9C4','--ink-faint':'#A98580','--grid':'255,140,110'}},
    {id:'aurora',name:'Aurora',lvl:7,v:{'--aqua':'#7CF5D8','--rose':'#B38CFF','--saffron':'#9BE8FF','--bg':'#0C1A22','--bg-deep':'#07121A','--surface':'#11262F','--surface-2':'#16303B','--line':'#23505D','--line-soft':'#1B3F4A','--ink-soft':'#BFE3E4','--ink-faint':'#7FA7AC','--grid':'124,245,216'}},
    {id:'sakura',name:'Sakura',lvl:10,v:{'--aqua':'#9AD8FF','--rose':'#FF8FB8','--saffron':'#FFE3A3','--bg':'#1D1424','--bg-deep':'#150E1B','--surface':'#2A1D33','--surface-2':'#35243F','--line':'#553B63','--line-soft':'#443050','--ink-soft':'#EAD0E4','--ink-faint':'#A98BA5','--grid':'255,143,184'}},
    {id:'royal',name:'Royal',lvl:14,v:{'--aqua':'#A3B8FF','--rose':'#C38BFF','--saffron':'#FFD36E','--bg':'#100B2E','--bg-deep':'#0A0720','--surface':'#1A1344','--surface-2':'#231A57','--line':'#3D2F85','--line-soft':'#30256B','--ink-soft':'#D3C8F5','--ink-faint':'#9185C2','--grid':'195,139,255'}},
    {id:'invariant',name:'Invariant Gold',lvl:20,v:{'--aqua':'#FFD166','--rose':'#FFA62B','--saffron':'#FFF0B3','--mint':'#7BE0AD','--bg':'#0B0905','--bg-deep':'#060503','--surface':'#17120A','--surface-2':'#221A0D','--line':'#5C4518','--line-soft':'#3E2F12','--ink':'#FFF8E6','--ink-soft':'#E9D6A6','--ink-faint':'#A89468','--grid':'255,196,80'}}];
  function applyTheme(id){ var t=THEMES.filter(function(x){return x.id===id;})[0]||THEMES[0], root=document.documentElement;
    THEMES.forEach(function(x){ Object.keys(x.v).forEach(function(k){ root.style.removeProperty(k); }); });
    Object.keys(t.v).forEach(function(k){ root.style.setProperty(k,t.v[k]); }); root.setAttribute('data-theme',t.id); }
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
    // peak Arena rating: current rating, plus earlier ratings reconstructed from the history's deltas
    var hist=(AR.history||[]).slice().sort(function(x,y){return y.t-x.t;}), rr=AR.rating||1200, peak=rr;
    hist.forEach(function(h){ rr-=(h.delta||0); peak=Math.max(peak,rr); });
    R.peakElo=Math.max(R.peakElo||0,peak,AR.rating||0);
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

  /* ---------------- badges: four tiers, each with its own metal and medal shape */
  function streakRun(L,filter){ var b=0,r=0; L.forEach(function(e){ if(filter&&!filter(e)) return; r=e.correct?r+1:0; b=Math.max(b,r); }); return b; }
  var PAPERS=[]; Object.keys(RATING).forEach(function(id){ var p=id.split('-')[0]; if(PAPERS.indexOf(p)<0) PAPERS.push(p); });
  var TOPQ=Object.keys(RATING).reduce(function(a,b){ return RATING[a]>=RATING[b]?a:b; });
  function metrics(s){ if(s._m) return s._m; var L=s.L, m={};
    var ok={}, perDay={}; L.forEach(function(e){ if(e.correct) ok[e.id]=1; var k=dkey(e.t); perDay[k]=(perDay[k]||0)+1; });
    m.correctIds=Object.keys(ok).length; m.maxDay=Object.keys(perDay).reduce(function(a,k){return Math.max(a,perDay[k]);},0);
    m.hard=L.filter(function(e){return e.correct&&rating(e.id)>=8;}).length;
    m.fastHard=L.filter(function(e){return e.correct&&rating(e.id)>=8&&e.secs<90;}).length;
    m.hardRun=streakRun(L,function(e){return rating(e.id)>=8;}); m.run=streakRun(L);
    var D=load('hu_duels',[]); m.duelWins=D.filter(function(h){return h.opp&&h.res==='win';}).length; m.duelsMade=D.filter(function(h){return !h.opp;}).length;
    var QW=load('hu_qotw',{}); m.qotw=Object.keys(QW).filter(function(w){return QW[w]&&QW[w].ok;}).length;
    m.daily=Object.keys(s.R.daily).filter(function(k){return s.R.daily[k].ok;}).length;
    var RV=load('hu_review',{}).items||{}; m.mastered=Object.keys(RV).filter(function(k){return RV[k].mastered;}).length; m.reviews=L.filter(function(e){return e.mode==='review';}).length;
    m.peakElo=s.R.peakElo||s.AR.rating||1200; m.winRun=s.AR.best||0;
    var tech={}; L.forEach(function(e){ if(e.correct)(e.tags||[]).forEach(function(x){tech[x]=1;}); }); m.tech=Object.keys(tech).length;
    var seen={}; L.forEach(function(e){ seen[e.paper]=1; }); m.papers=PAPERS.filter(function(p){return seen[p];}).length;
    m.perfectPaper=PAPERS.reduce(function(best,p){ var n=0; for(var i=1;i<=20;i++) if(ok[p+'-'+i]) n++; return Math.max(best,n); },0);
    s._m=m; return m; }
  function B(id,name,tier,d,test,prog){ return {id:id,name:name,tier:tier,d:d,f:test,p:prog}; }
  function cnt(key,goal){ return [function(s){return metrics(s)[key]>=goal;},function(s){return [Math.min(goal,metrics(s)[key]),goal];}]; }
  function mk(id,name,tier,d,key,goal){ var c=cnt(key,goal); return B(id,name,tier,d,c[0],c[1]); }
  var BADGES=[
    /* bronze: your first steps */
    B('first','First Point',0,'Answer your first question.',function(s){return s.L.length>0||s.R.maxAnswers>0;}),
    B('three','Three in a Row',0,'Practise on 3 days running.',function(s){return s.best>=3;},function(s){return [Math.min(3,s.best),3];}),
    B('dailyone','Daily Habit',0,'Solve a daily challenge.',function(s){return metrics(s).daily>=1;}),
    B('throwdown','Throw Down',0,'Send a friend a duel challenge.',function(s){return metrics(s).duelsMade>=1||metrics(s).duelWins>=1;}),
    B('lookagain','Look Again',0,'Finish your first mistake review.',function(s){return metrics(s).reviews>=1;}),
    B('newlook','New Look',0,'Switch the site to a theme other than Indigo.',function(s){return s.R.theme&&s.R.theme!=='indigo';}),
    B('contender','Contender',0,'Reach an Arena rating of 1400.',function(s){return metrics(s).peakElo>=1400;},function(s){return [Math.min(1400,metrics(s).peakElo),1400];}),
    B('rung','Rung Runner',0,'Score 1000 in a ten-minute ladder.',function(s){return s.LB>=1000;},function(s){return [Math.min(1000,s.LB),1000];}),
    B('owl','Night Owl',0,'Get a question right between midnight and 5am.',function(s){return s.L.some(function(e){return e.correct&&new Date(e.t).getHours()<5;});}),
    /* silver: real habits */
    B('century','Century',1,'Answer 100 questions.',function(s){return s.R.maxAnswers>=100;},function(s){return [Math.min(100,s.R.maxAnswers),100];}),
    mk('chain','Unbroken Chain',1,'Get 10 answers right in a row.','run',10),
    mk('deep','Deep End',1,'Get 10 questions rated 8 or above right.','hard',10),
    B('spare','Time to Spare',1,'Score 15 or more on a standard-time paper in under an hour.',function(s){return s.A.some(function(a){return a.score>=15&&a.secs<=3600&&(a.timing||4500)===4500;});}),
    mk('collector','Set Collector',1,'Answer a question from every paper on the site.','papers',PAPERS.length),
    mk('polymath','Polymath',1,'Get questions right in 15 different techniques.','tech',15),
    B('challenger','Challenger',1,'Reach an Arena rating of 1600.',function(s){return metrics(s).peakElo>=1600;},function(s){return [Math.min(1600,metrics(s).peakElo),1600];}),
    B('week','Week of Wonders',1,'Practise on 7 days running.',function(s){return s.best>=7;},function(s){return [Math.min(7,s.best),7];}),
    mk('devotee','Daily Devotee',1,'Solve 7 daily challenges.','daily',7),
    mk('rival','Friendly Rival',1,'Win a duel against a friend.','duelWins',1),
    mk('second','Second Chance',1,'Master 10 questions from your mistake review queue.','mastered',10),
    mk('marathon','Marathon',1,'Answer 60 questions in a single day.','maxDay',60),
    B('viva','Viva Survivor',1,'Finish a mock interview.',function(s){return s.IV.length>0;}),
    /* gold: hard */
    B('thousand','A Thousand Cuts',2,'Answer 1000 questions.',function(s){return s.R.maxAnswers>=1000;},function(s){return [Math.min(1000,s.R.maxAnswers),1000];}),
    B('lightning','Lightning Proof',2,'Get a question rated 8 or above right in under 90 seconds.',function(s){return metrics(s).fastHard>=1;}),
    B('ninepoint','Nine Point Oh',2,'Solve the single hardest question on the site.',function(s){return s.L.some(function(e){return e.correct&&e.id===TOPQ;});}),
    B('clean','Clean Sheet',2,'Score 20 out of 20 on any timed paper.',function(s){return s.A.some(function(a){return a.score>=20;});}),
    mk('perfect','Paper Perfect',2,'Over any number of sittings, answer every question of one paper correctly.','perfectPaper',20),
    B('slayer','Giant Slayer',2,'Beat the Olympian bot in an Arena duel.',function(s){return (s.AR.history||[]).some(function(h){return /olympian/i.test(h.bot)&&h.you>h.them;});}),
    B('grandmaster','Grandmaster',2,'Reach an Arena rating of 1800.',function(s){return metrics(s).peakElo>=1800;},function(s){return [Math.min(1800,metrics(s).peakElo),1800];}),
    B('summit','Summit',2,'Score 2500 in a ten-minute ladder.',function(s){return s.LB>=2500;},function(s){return [Math.min(2500,s.LB),2500];}),
    B('month','Month of Maths',2,'Practise on 30 days running.',function(s){return s.best>=30;},function(s){return [Math.min(30,s.best),30];}),
    mk('weekly','Problem Solver',2,'Solve four problems of the week.','qotw',4),
    mk('ironnerve','Iron Nerve',2,'Get 5 questions rated 8 or above right in a row.','hardRun',5),
    mk('quicksilver','Quicksilver',2,'Get 10 questions rated 8 or above right, each in under 90 seconds.','fastHard',10),
    mk('champion','Club Champion',2,'Win 5 duels against friends.','duelWins',5),
    mk('almanac','Almanac',2,'Solve 30 daily challenges.','daily',30),
    mk('cleanslate','Clean Slate',2,'Master 50 questions from your mistake review queue.','mastered',50),
    /* invariant: legendary */
    B('flawless','Flawless',3,'Score 20 out of 20 on a Set G or Set H paper at standard time.',function(s){return s.A.some(function(a){return a.score>=20&&/^[GH]/.test(a.paper||'')&&(a.timing||4500)===4500;});}),
    B('centurion','Centurion',3,'Practise on 100 days running.',function(s){return s.best>=100;},function(s){return [Math.min(100,s.best),100];}),
    B('unstoppable','Unstoppable',3,'Win 10 Arena duels in a row.',function(s){return metrics(s).winRun>=10;},function(s){return [Math.min(10,metrics(s).winRun),10];}),
    B('mind','Invariant Mind',3,'Reach an Arena rating of 2000.',function(s){return metrics(s).peakElo>=2000;},function(s){return [Math.min(2000,metrics(s).peakElo),2000];}),
    B('beyond','Beyond the Summit',3,'Score 4000 in a ten-minute ladder.',function(s){return s.LB>=4000;},function(s){return [Math.min(4000,s.LB),4000];}),
    mk('omniscient','Omniscient',3,'Answer every question on the site correctly at least once.','correctIds',Object.keys(RATING).length),
    B('apex','Invariant',3,'Reach level 25.',function(s){return s.level>=25;},function(s){return [Math.min(25,s.level),25];})];
  var TIER=['Bronze','Silver','Gold','Invariant'], TIERCOL=['#E3A06F','#C9D3E6','#FFC53D','#FF8FB8'];
  var METAL=[['#F6C9A0','#C98049','#7A431E'],['#FFFFFF','#BFC9DB','#6C7690'],['#FFF3B8','#FFC53D','#9A6300'],['#4FD8E8','#FF6B8B','#FFC53D']];
  var RIBBON=['#FF6B8B','#4FD8E8','#FFC53D','url(#rwIri)'];
  function earnedBadges(s){ return BADGES.filter(function(b){ try{ return b.f(s); }catch(e){ return false; } }).map(function(b){return b.id;}); }
  function starPts(n,ro,ri,cx,cy){ var p=[]; for(var i=0;i<2*n;i++){ var r=i%2?ri:ro, a=Math.PI*i/n-Math.PI/2; p.push((cx+r*Math.cos(a)).toFixed(2)+','+(cy+r*Math.sin(a)).toFixed(2)); } return p.join(' '); }
  var MID=0;
  function medal(b,got,size){ size=size||64; var t=b.tier||0, id='rwm'+(++MID), m=METAL[t];
    var shape=t===0?'<circle cx="32" cy="28" r="21"':t===1?'<polygon points="'+starPts(3,23,23,32,28).split(' ').filter(function(_,i){return i%2===0;}).join(' ')+'"':t===2?'<polygon points="'+starPts(8,24,19.5,32,28)+'"':'<polygon points="'+starPts(12,25,20.5,32,28)+'"';
    if(t===1){ var h=[]; for(var i=0;i<6;i++){ var a=Math.PI/3*i-Math.PI/2; h.push((32+23*Math.cos(a)).toFixed(2)+','+(28+23*Math.sin(a)).toFixed(2)); } shape='<polygon points="'+h.join(' ')+'"'; }
    if(!got) return '<svg viewBox="0 0 64 64" width="'+size+'" height="'+size+'" aria-hidden="true"><path d="M24 44 L20 60 L27 56 L32 61 L32 46Z M40 44 L44 60 L37 56 L32 61 L32 46Z" fill="none" stroke="var(--line,#343A82)" stroke-width="1.2"/>'+shape+' fill="none" stroke="var(--line,#343A82)" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M22 37 L42 37 L34 19 Z" fill="none" stroke="var(--line,#343A82)" stroke-width="2" stroke-linejoin="round"/></svg>';
    var grad=t===3
      ?'<linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FD8E8"/><stop offset=".5" stop-color="#FF6B8B"/><stop offset="1" stop-color="#FFC53D"/><animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="7s" repeatCount="indefinite"/></linearGradient><linearGradient id="rwIri" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4FD8E8"/><stop offset=".5" stop-color="#FF6B8B"/><stop offset="1" stop-color="#FFC53D"/></linearGradient>'
      :'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+m[0]+'"/><stop offset=".55" stop-color="'+m[1]+'"/><stop offset="1" stop-color="'+m[2]+'"/></linearGradient>';
    var ink=t===3?'#FFFFFF':'#1A1438';
    return '<svg viewBox="0 0 64 64" width="'+size+'" height="'+size+'" aria-hidden="true"><defs>'+grad+'<radialGradient id="'+id+'s" cx=".35" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
      +'<path d="M24 44 L20 60 L27 56 L32 61 L32 46Z" fill="'+(t===3?'#4FD8E8':RIBBON[t])+'"/><path d="M40 44 L44 60 L37 56 L32 61 L32 46Z" fill="'+(t===3?'#FF6B8B':RIBBON[t])+'" opacity=".85"/>'
      +shape+' fill="url(#'+id+')" stroke="'+(t===3?'#fff':m[2])+'" stroke-opacity="'+(t===3?.6:1)+'" stroke-width="1.4"/>'+shape+' fill="url(#'+id+'s)"/>'
      +'<path d="M22 37 L42 37 L34 19 Z" fill="none" stroke="'+ink+'" stroke-opacity=".82" stroke-width="2.2" stroke-linejoin="round"/><circle cx="33" cy="31.3" r="5.3" fill="none" stroke="'+ink+'" stroke-opacity=".82" stroke-width="1.6"/></svg>'; }

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
   +'.rw-conf{position:fixed;inset:0;pointer-events:none;z-index:10001}'
   +'html[data-theme]:not([data-theme="indigo"]){--aqua-wash:color-mix(in srgb,var(--aqua) 13%,transparent);--rose-wash:color-mix(in srgb,var(--rose) 14%,transparent);--saffron-wash:color-mix(in srgb,var(--saffron) 14%,transparent);--mint-wash:color-mix(in srgb,var(--mint) 14%,transparent)}'
   +'html[data-theme]:not([data-theme="indigo"]) body{background-image:radial-gradient(1100px 520px at 78% -8%,color-mix(in srgb,var(--aqua) 13%,transparent),transparent 60%),radial-gradient(900px 480px at -10% 8%,color-mix(in srgb,var(--rose) 10%,transparent),transparent 60%),linear-gradient(rgba(var(--grid),.055) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--grid),.055) 1px,transparent 1px)}'
   +'html[data-theme]:not([data-theme="indigo"]) a:not(.btn):hover{color:color-mix(in srgb,var(--aqua) 72%,#fff)}'
   +'html[data-theme]:not([data-theme="indigo"]) .btn:hover{background:color-mix(in srgb,var(--rose) 78%,#fff);border-color:color-mix(in srgb,var(--rose) 78%,#fff)}'
   +'html[data-theme]:not([data-theme="indigo"]) .btn.secondary{border-color:color-mix(in srgb,var(--aqua) 55%,transparent)}html[data-theme]:not([data-theme="indigo"]) .btn.secondary:hover{background:var(--aqua-wash);color:var(--aqua)}'
   +'html[data-theme="royal"] .panel,html[data-theme="royal"] .card{box-shadow:0 0 0 1px rgba(195,139,255,.07),0 18px 50px -28px rgba(195,139,255,.55)}'
   +'html[data-theme="invariant"] h1,html[data-theme="invariant"] .title,html[data-theme="invariant"] .panel h2{background:linear-gradient(100deg,#FFF3C4 0%,#FFD166 30%,#FFA62B 55%,#FFE9A0 80%,#FFD166 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:rwGold 9s ease-in-out infinite}'
   +'html[data-theme="invariant"] .btn:not(.secondary):not(:disabled){background:linear-gradient(110deg,#E8921C 0%,#FFD166 40%,#FFF6CF 50%,#FFD166 60%,#E8921C 100%);background-size:260% 100%;border-color:#FFB547;color:#1A1204;animation:rwSheen 5s linear infinite}'
   +'html[data-theme="invariant"] .panel,html[data-theme="invariant"] .card{box-shadow:inset 0 1px 0 rgba(255,225,150,.09),0 20px 60px -34px rgba(255,166,43,.45)}'
   +'html[data-theme="invariant"] .site-nav .links a.rw-pill:not(.rv){border-color:#C98A1E;box-shadow:0 0 14px -2px rgba(255,176,60,.55)}'
   +'html[data-theme="invariant"] #ringArc{filter:drop-shadow(0 0 7px rgba(255,190,80,.65))}'
   +'@keyframes rwSheen{from{background-position:120% 0}to{background-position:-160% 0}}@keyframes rwGold{0%,100%{background-position:0% 0}50%{background-position:100% 0}}'
   +'@media (prefers-reduced-motion:reduce){html[data-theme="invariant"] h1,html[data-theme="invariant"] .title,html[data-theme="invariant"] .panel h2,html[data-theme="invariant"] .btn{animation:none}}';
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
    var m=document.createElement('div'); m.className='rw-modal'; m.innerHTML='<div class="card" role="dialog" aria-label="Level up">'+medal({tier:s.level>=20?3:s.level>=10?2:s.level>=5?1:0},true,84)+'<h2>Level '+s.level+'</h2><p>You are now a <strong>'+esc(s.title)+'</strong>.'+(unlocked?' The <strong>'+unlocked.name+'</strong> theme is unlocked.':'')+'</p><button type="button">Keep going</button></div>';
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

  window.HU_REWARDS={snapshot:snapshot,tick:tick,BADGES:BADGES,TIER:TIER,TIERCOL:TIERCOL,METAL:METAL,medal:medal,metrics:metrics,THEMES:THEMES,setTheme:setTheme,weekQuests:weekQuests,claim:claim,
    dailyId:dailyId,dailyNumber:dailyNumber,recordDaily:recordDaily,earnedBadges:earnedBadges,titleOf:titleOf,need:need,XP_RULES:XP_RULES,rating:rating,
    setLeaderboard:setLeaderboard,fetchLeaderboard:fetchLeaderboard,displayName:displayName,dkey:dkey,shift:shift,today:today,esc:esc,FLAME:FLAME,
    review:{sync:reviewSync,due:reviewDue,record:reviewRecord,state:reviewState,GAPS:GAPS}};
  applyTheme(state().theme);
  function boot(){ inject(); tick(); setInterval(tick,4000); window.addEventListener('storage',function(e){ if(!e.key||e.key.indexOf('hu_')===0) tick(); }); window.addEventListener('hu-auth-event',function(){ setTimeout(tick,1500); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
