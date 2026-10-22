/* Logic gym engine: generates TMUA Paper 2 logic questions and marks them by exhaustive checking.
   Each condition is periodic with period dividing 12, changes truth only for |n| <= 10, or is primality or
   being a square; primes below 120 reach every residue class mod 12 that primes ever reach, and squares mod 12
   repeat from 0 to 9. So checking every integer from -120 to 120 decides each implication for all integers.
   Pure functions: logic.html renders them, and node can test them (tools/test_logic_gym.js). */
(function(root){
  var LO=-120, HI=120;
  function isPrime(n){ if(n<2) return false; for(var d=2;d*d<=n;d++) if(n%d===0) return false; return true; }
  function isSquare(n){ if(n<0) return false; var r=Math.round(Math.sqrt(n)); return r*r===n; }
  function mod(a,m){ return ((a%m)+m)%m; }
  var N='<i>n</i>';
  /* t: the condition; f: its negation, worded naturally */
  var P=[
    {id:'even', t:N+' is even', f:N+' is odd', ok:function(n){ return mod(n,2)===0; }},
    {id:'odd', t:N+' is odd', f:N+' is even', ok:function(n){ return mod(n,2)===1; }},
    {id:'m3', t:N+' is a multiple of 3', f:N+' is not a multiple of 3', ok:function(n){ return mod(n,3)===0; }},
    {id:'n3', t:N+' is not a multiple of 3', f:N+' is a multiple of 3', ok:function(n){ return mod(n,3)!==0; }},
    {id:'m4', t:N+' is a multiple of 4', f:N+' is not a multiple of 4', ok:function(n){ return mod(n,4)===0; }},
    {id:'m6', t:N+' is a multiple of 6', f:N+' is not a multiple of 6', ok:function(n){ return mod(n,6)===0; }},
    {id:'m12', t:N+' is a multiple of 12', f:N+' is not a multiple of 12', ok:function(n){ return mod(n,12)===0; }},
    {id:'sqeven', t:N+'&sup2; is even', f:N+'&sup2; is odd', ok:function(n){ return mod(n*n,2)===0; }},
    {id:'sq4', t:N+'&sup2; is a multiple of 4', f:N+'&sup2; is not a multiple of 4', ok:function(n){ return mod(n*n,4)===0; }},
    {id:'sq8', t:N+'&sup2; is a multiple of 8', f:N+'&sup2; is not a multiple of 8', ok:function(n){ return mod(n*n,8)===0; }},
    {id:'sq3', t:N+'&sup2; &minus; 1 is a multiple of 3', f:N+'&sup2; &minus; 1 is not a multiple of 3', ok:function(n){ return mod(n*n-1,3)===0; }},
    {id:'cube6', t:N+'&sup3; &minus; '+N+' is a multiple of 6', f:N+'&sup3; &minus; '+N+' is not a multiple of 6', ok:function(n){ return mod(n*n*n-n,6)===0; }},
    {id:'never', t:N+'&sup2; + 1 is a multiple of 3', f:N+'&sup2; + 1 is not a multiple of 3', ok:function(n){ return mod(n*n+1,3)===0; }},
    {id:'r41', t:N+' &minus; 1 is a multiple of 4', f:N+' &minus; 1 is not a multiple of 4', ok:function(n){ return mod(n-1,4)===0; }},
    {id:'gt3', t:N+' &gt; 3', f:N+' &le; 3', ok:function(n){ return n>3; }},
    {id:'ge4', t:N+' &ge; 4', f:N+' &lt; 4', ok:function(n){ return n>=4; }},
    {id:'gt2', t:N+' &gt; 2', f:N+' &le; 2', ok:function(n){ return n>2; }},
    {id:'cube8', t:N+'&sup3; &gt; 8', f:N+'&sup3; &le; 8', ok:function(n){ return n*n*n>8; }},
    {id:'sq4gt', t:N+'&sup2; &gt; 4', f:N+'&sup2; &le; 4', ok:function(n){ return n*n>4; }},
    {id:'sq9gt', t:N+'&sup2; &gt; 9', f:N+'&sup2; &le; 9', ok:function(n){ return n*n>9; }},
    {id:'abs3', t:'|'+N+'| &gt; 3', f:'|'+N+'| &le; 3', ok:function(n){ return Math.abs(n)>3; }},
    {id:'nn', t:N+' &ge; 0', f:N+' &lt; 0', ok:function(n){ return n>=0; }},
    {id:'lt10', t:N+' &lt; 10', f:N+' &ge; 10', ok:function(n){ return n<10; }},
    {id:'prime', t:N+' is prime', f:N+' is not prime', ok:isPrime},
    {id:'square', t:N+' is a perfect square', f:N+' is not a perfect square', ok:isSquare},
    {id:'two', t:N+' = 2', f:N+' &ne; 2', ok:function(n){ return n===2; }}
  ];
  var BYID={}; P.forEach(function(p){ BYID[p.id]=p; });

  /* smallest |n| (positive first) with A true and B false, or null if A implies B */
  function counter(A,B){
    for(var k=0;k<=HI;k++){ var c=k===0?[0]:[k,-k];
      for(var i=0;i<c.length;i++){ var n=c[i]; if(A.ok(n)&&!B.ok(n)) return n; } }
    return null;
  }
  function always(p){ for(var n=LO;n<=HI;n++) if(!p.ok(n)) return false; return true; }
  function never(p){ for(var n=LO;n<=HI;n++) if(p.ok(n)) return false; return true; }
  function rel(A,B){ var ab=counter(A,B)===null, ba=counter(B,A)===null; return ab&&ba?'both':ab?'suff':ba?'nec':'neither'; }

  function rng(seed){ if(seed==null) return Math.random; var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
  function pick(r,a){ return a[Math.floor(r()*a.length)]; }
  function shuffle(r,a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  /* the condition with a number in place of n: (-3)^2, |-3| */
  function sub(text,n){ var v=n<0?'&minus;'+(-n):String(n);
    return text.split('|'+N+'|').join('|'+v+'|').split(N).join(n<0?'('+v+')':v); }

  var PAIRS=null;
  function pairs(){ if(PAIRS) return PAIRS; PAIRS={both:[],suff:[],nec:[],neither:[],trap:[]};
    P.forEach(function(A){ P.forEach(function(B){ if(A===B||A.f===B.t||A.t===B.f) return; /* complements make degenerate questions */
      var trivial=always(A)||never(A)||always(B)||never(B), k=rel(A,B);
      (trivial?PAIRS.trap:PAIRS[k]).push([A,B]); }); });
    return PAIRS; }

  var NS_OPTS=[['nec','necessary but not sufficient for'],['suff','sufficient but not necessary for'],['both','necessary and sufficient for'],['neither','neither necessary nor sufficient for']];
  function verdictLine(A,B,dir){ var c=dir?counter(A,B):counter(B,A), from=dir?A:B, to=dir?B:A;
    var ask='Does &ldquo;'+from.t+'&rdquo; guarantee &ldquo;'+to.t+'&rdquo;? ';
    return c===null?ask+'<b>Yes</b>, for every integer.'
                   :ask+'<b>No</b>. Take '+N+' = '+sub(N,c)+': '+sub(from.t,c)+', but '+sub(to.f,c)+'.'; }

  function genNS(r){
    var key=r()<.12?'trap':pick(r,['both','suff','nec','neither']), pool=pairs()[key], pr=pick(r,pool), A=pr[0], B=pr[1], k=rel(A,B);
    var ans=NS_OPTS.map(function(o){ return o[0]; }).indexOf(k);
    var trap='';
    if(always(B)) trap='Condition B holds for every integer, so anything is sufficient for it, and it is necessary for everything.';
    else if(always(A)) trap='Condition A holds for every integer, so it is necessary for anything.';
    else if(never(A)) trap='Condition A is never true (squares leave remainder 0 or 1 on division by 3), so "if A then B" is vacuously true: A is sufficient for anything.';
    else if(never(B)) trap='Condition B is never true, so nothing that can happen is sufficient for it.';
    return {type:'ns', prompt:'<p>Let '+N+' be an integer. Consider the conditions</p><p class="c">A: '+A.t+'&emsp; B: '+B.t+'</p><p>Condition A is &hellip;</p>',
      opts:NS_OPTS.map(function(o){ return o[1]+' B'; }), ans:ans,
      explain:'<p>'+verdictLine(A,B,true)+' So A '+(counter(A,B)===null?'is':'is not')+' sufficient for B.</p><p>'+verdictLine(A,B,false)+' So A '+(counter(B,A)===null?'is':'is not')+' necessary for B.</p>'+(trap?'<p>'+trap+'</p>':'')};
  }

  function genCounter(r){
    var key=r()<.3?pick(r,['both','suff']):pick(r,['nec','neither']), pr=pick(r,pairs()[key]), A=pr[0], B=pr[1], c=counter(A,B);
    return {type:'counter', prompt:'<p>Is this statement true?</p><p class="c">For every integer '+N+', if '+A.t+', then '+B.t+'.</p><p>If it is false, give a counterexample.</p>',
      A:A, B:B, isTrue:c===null, example:c,
      explain:c===null?'<p>It is true. '+verdictLine(A,B,true)+'</p>':'<p>It is false. For example '+N+' = '+sub('<i>n</i>',c)+': '+sub(A.t,c)+', but '+sub(B.f,c)+'. Any integer that makes the first part true and the second false works.</p>'};
  }
  /* mark a counterexample answer: value is an integer string, or 'true' */
  function markCounter(q,value){
    if(value==='true') return {ok:q.isTrue, msg:q.isTrue?'Right: there is no counterexample.':'It is false: there is a counterexample.'};
    var n=parseInt(value,10); if(isNaN(n)||String(n)!==String(value).trim()) return {ok:false, msg:'Enter a whole number, or choose "It is true".'};
    if(Math.abs(n)>1e6) return {ok:false, msg:'Pick a smaller number.'};
    if(q.A.ok(n)&&!q.B.ok(n)) return {ok:true, msg:N+' = '+sub(N,n)+' works: '+sub(q.A.t,n)+', but '+sub(q.B.f,n)+'.'};
    if(!q.A.ok(n)) return {ok:false, msg:'With '+N+' = '+sub(N,n)+', '+sub(q.A.f,n)+', so the statement makes no claim about it.'};
    return {ok:false, msg:'With '+N+' = '+sub(N,n)+', '+sub(q.A.t,n)+' and '+sub(q.B.t,n)+', which agrees with the statement.'};
  }

  function genForms(r){
    var pool=pairs().suff.concat(pairs().neither,pairs().nec), pr=pick(r,pool), A=pr[0], B=pr[1];
    var all='For every integer '+N+', ', ex='There is an integer '+N+' such that ';
    var forms={
      contra: all+'if '+B.f+', then '+A.f+'.', converse: all+'if '+B.t+', then '+A.t+'.', inverse: all+'if '+A.f+', then '+B.f+'.',
      negation: ex+A.t+' and '+B.f+'.', allneg: all+A.t+' and '+B.f+'.', exconv: ex+B.t+' and '+A.f+'.'};
    var ask=pick(r,[['equivalent to','contra','The contrapositive, "if not B then not A", is equivalent. The converse and the inverse are equivalent to each other, but not to the original.'],
                    ['the negation of','negation','A universal "if A then B" fails exactly when some '+N+' has A true and B false. The negation of "for every" is "there is".'],
                    ['the converse of','converse','The converse swaps the two parts: "if B then A". It can be true or false independently of the original.']]);
    var keys=shuffle(r,Object.keys(forms));
    return {type:'forms', prompt:'<p>Statement S:</p><p class="c">'+all+'if '+A.t+', then '+B.t+'.</p><p>Which of the following is '+ask[0]+' S?</p>',
      opts:keys.map(function(k){ return forms[k]; }), ans:keys.indexOf(ask[1]), explain:'<p>'+ask[2]+'</p>'};
  }

  var REL=[{t:'<i>y</i> &gt; <i>x</i>', f:'<i>y</i> &le; <i>x</i>'},{t:'<i>x</i> + <i>y</i> = 0', f:'<i>x</i> + <i>y</i> &ne; 0'},
           {t:'<i>xy</i> = 1', f:'<i>xy</i> &ne; 1'},{t:'<i>y</i>&sup2; = <i>x</i>', f:'<i>y</i>&sup2; &ne; <i>x</i>'},{t:'<i>y</i> &lt; <i>x</i>&sup2;', f:'<i>y</i> &ge; <i>x</i>&sup2;'}];
  function genQuant(r){
    var R=pick(r,REL), q1=r()<.5, q2=r()<.5;
    var X='<i>x</i>', Y='<i>y</i>';
    function say(a,b,neg){ var c=neg?R.f:R.t;
      if(a&&b) return 'For all real numbers '+X+' and '+Y+', '+c+'.';
      if(a) return 'For every real number '+X+' there is a real number '+Y+' such that '+c+'.';
      if(b) return 'There is a real number '+X+' such that, for every real number '+Y+', '+c+'.';
      return 'There are real numbers '+X+' and '+Y+' such that '+c+'.'; }
    var forms={right:say(!q1,!q2,true), keepq:say(q1,q2,true), first:say(!q1,q2,true), second:say(q1,!q2,true), flipnot:say(!q1,!q2,false), swap:say(q2,q1,true)};
    var uniq={}; Object.keys(forms).forEach(function(k){ if(!uniq[forms[k]]) uniq[forms[k]]=k; });
    var keys=shuffle(r,Object.keys(uniq).map(function(s){ return uniq[s]; }));
    return {type:'quant', prompt:'<p>Statement T:</p><p class="c">'+say(q1,q2,false)+'</p><p>Which of the following is the negation of T?</p>',
      opts:keys.map(function(k){ return forms[k]; }), ans:keys.indexOf('right'),
      explain:'<p>Negate from the outside in: every "for every" becomes "there is", every "there is" becomes "for every", the order stays the same, and the final condition is negated, so '+R.t+' becomes '+R.f+'.</p>'};
  }

  var GEN={ns:genNS, counter:genCounter, forms:genForms, quant:genQuant};
  function generate(type,seed){ var r=rng(seed); if(!GEN[type]) type=pick(r,['ns','ns','counter','forms','quant']); return GEN[type](r); }

  var api={generate:generate, markCounter:markCounter, predicates:P, rel:rel, counter:counter, always:always, never:never, pairs:pairs, LO:LO, HI:HI};
  root.KV_LOGIC=api; if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:this);
