/* Kevinvariant geometry prover.
   Proves a chosen relation in the sandbox figure by angle chasing and length chasing.

   Directions of lines are variables mod 180 degrees (stored in units of pi, mod 1), lengths are
   variables through their logarithms. Every fact contributes linear equations, and a statement
   follows when its equation lies in the integer span of the known ones.

   Only facts that the construction gives are premises. The numbers in the figure are used for two
   things only: to decide which statements are worth trying (a statement that is false in the figure
   cannot be derived, so it is never tried), and to check that each rule is applied with the right
   signs before its equations are added. */
(function(global){
'use strict';

function mod1(x){ x%=1; return x<0?x+1:x; }
function nearC(x,c){ var m=mod1(x-c); return Math.min(m,1-m)<1e-6; }

/* ---------- integer linear span with source tracking ---------- */
function Span(){ this.rows=[]; this.piv={}; }
Span.prototype.reduce=function(v){
  var out={}, k, src=[];
  for(k in v) if(v[k]) out[k]=v[k];
  for(k in v){ var ri=this.piv[k]; if(ri===undefined||!out[k]) continue;
    var row=this.rows[ri], c=out[k];
    for(var kk in row.v){ var nv=(out[kk]||0)-c*row.v[kk]; if(nv) out[kk]=nv; else delete out[kk]; }
    src.push(row.src); }
  return {v:out,src:src};
};
Span.prototype.add=function(v,srcIds){
  var r=this.reduce(v), keys=Object.keys(r.v); if(!keys.length) return false;
  var p=null; for(var i=0;i<keys.length;i++){ var c=r.v[keys[i]]; if(c===1||c===-1){ p=keys[i]; break; } }
  if(p===null) return false;                       /* no unit pivot: rare, and safe to leave out */
  var s=new Set(srcIds); r.src.forEach(function(S){ S.forEach(function(x){ s.add(x); }); });
  if(r.v[p]===-1) for(var k in r.v) r.v[k]=-r.v[k];
  this.rows.forEach(function(row){ var c=row.v[p]; if(!c) return;
    for(var k in r.v){ var nv=(row.v[k]||0)-c*r.v[k]; if(nv) row.v[k]=nv; else delete row.v[k]; }
    s.forEach(function(x){ row.src.add(x); }); });
  this.piv[p]=this.rows.length; this.rows.push({v:r.v,src:s});
  return true;
};
Span.prototype.implied=function(v){
  var r=this.reduce(v); if(Object.keys(r.v).length) return null;
  var s=new Set(); r.src.forEach(function(S){ S.forEach(function(x){ s.add(x); }); }); return s;
};

/* ---------- the engine ---------- */
function Engine(){
  var self=this;
  /* hidden helper points of a known kind (a circumcentre used to draw a line, say) take part too; visible ones win a tie */
  var KNOWN={ccen:1,mid:1,foot:1,orth:1,inc:1,cent:1,refl:1,reflp:1,inter:1,ilc:1,icc:1,tanpt:1};
  var P=objs.filter(function(o){ return o.type==='point'&&o.g&&isFinite(o.g.x)&&(!o.hidden||(KNOWN[o.kind]&&o.label)); });
  P.sort(function(a,b){ return (a.hidden?1:0)-(b.hidden?1:0); });
  var xs=P.map(function(p){return p.g.x;}), ys=P.map(function(p){return p.g.y;});
  this.D=Math.max(30,Math.max.apply(null,xs)-Math.min.apply(null,xs),Math.max.apply(null,ys)-Math.min.apply(null,ys));
  var tol=this.D*1e-7;
  this.pts=[]; this.ix={};
  P.forEach(function(p){ if(self.pts.some(function(q){ return Math.hypot(q.g.x-p.g.x,q.g.y-p.g.y)<tol; })) return; self.ix[p.id]=self.pts.length; self.pts.push(p); });
  this.lines=objs.filter(function(o){ return o.type==='line'&&o.g&&isFinite(o.g.x1)&&isFinite(o.g.x2)&&Math.hypot(o.g.x2-o.g.x1,o.g.y2-o.g.y1)>1e-9; });
  this.circles=objs.filter(function(o){ return o.type==='circle'&&o.g&&isFinite(o.g.r)&&o.g.r>1e-9; });
  this.av={}; this.aval=[]; this.qv={}; this.qval=[];
  this.A=new Span(); this.L=new Span();
  this.facts=[]; this.fkey={};
  this.members={}; this.cmembers={}; this.centreOf={};
  this.hypotheses();
}
var E=Engine.prototype;
E.lab=function(i){ return this.pts[i].label; };
/* direction of the line through points i, j */
E.d=function(i,j){ if(i>j){ var t=i; i=j; j=t; } var k='p'+i+'_'+j;
  if(this.av[k]===undefined){ var a=this.pts[i].g,b=this.pts[j].g; this.av[k]=this.aval.length; this.aval.push(mod1(Math.atan2(b.y-a.y,b.x-a.x)/Math.PI)); }
  return this.av[k]; };
/* direction of a line object */
E.dl=function(l){ var k='l'+l.id;
  if(this.av[k]===undefined){ this.av[k]=this.aval.length; this.aval.push(mod1(Math.atan2(l.g.y2-l.g.y1,l.g.x2-l.g.x1)/Math.PI)); }
  return this.av[k]; };
/* log of the length of segment i j */
E.q=function(i,j){ if(i>j){ var t=i; i=j; j=t; } var k='q'+i+'_'+j;
  if(this.qv[k]===undefined){ var a=this.pts[i].g,b=this.pts[j].g; this.qv[k]=this.qval.length; this.qval.push(Math.log(Math.hypot(b.x-a.x,b.y-a.y))); }
  return this.qv[k]; };
function vec(terms){ var v={}; terms.forEach(function(t){ if(t[1]===undefined) return; v[t[1]]=(v[t[1]]||0)+t[0]; if(!v[t[1]]) delete v[t[1]]; }); return v; }
E.aValue=function(v){ var s=0; for(var k in v) s+=v[k]*this.aval[k]; return s; };
E.lValue=function(v){ var s=0; for(var k in v) s+=v[k]*this.qval[k]; return s; };
/* an angle row {v, c}: sum of coefficients times directions is c (0 or 1/2) mod 180 degrees */
E.okA=function(r){ return nearC(this.aValue(r.v),r.c); };
E.okL=function(r){ return Math.abs(this.lValue(r.v)-r.c)<1e-6; };

/* ---------- row builders ---------- */
E.rowsColl=function(i,j,k){ return [{v:vec([[1,this.d(i,j)],[-1,this.d(i,k)]]),c:0},{v:vec([[1,this.d(i,j)],[-1,this.d(j,k)]]),c:0}]; };
E.rowsCyc=function(q){ var r=[], self=this;
  [[0,1,2,3],[0,2,1,3],[0,3,1,2],[2,3,0,1],[1,3,0,2],[1,2,0,3]].forEach(function(t){
    var X=q[t[0]],Y=q[t[1]],Pp=q[t[2]],Qq=q[t[3]];
    r.push({v:vec([[1,self.d(Pp,X)],[-1,self.d(Pp,Y)],[-1,self.d(Qq,X)],[1,self.d(Qq,Y)]]),c:0}); });
  return r; };
E.rowIso=function(x,a,b){ return {v:vec([[1,this.d(a,x)],[1,this.d(b,x)],[-2,this.d(a,b)]]),c:0}; };
E.rowLenEq=function(a,b,c,d){ return {v:vec([[1,this.q(a,b)],[-1,this.q(c,d)]]),c:0}; };
/* O is the centre of a circle through a, b and x: the angle between OA and AB is a right angle minus the inscribed angle at x */
E.rowCentre=function(o,a,b,x){
  var v1=vec([[1,this.d(a,o)],[-1,this.d(a,b)],[1,this.d(x,a)],[-1,this.d(x,b)]]),
      v2=vec([[1,this.d(a,o)],[-1,this.d(a,b)],[-1,this.d(x,a)],[1,this.d(x,b)]]);
  if(nearC(this.aValue(v1),0.5)) return {v:v1,c:0.5};
  if(nearC(this.aValue(v2),0.5)) return {v:v2,c:0.5};
  return null; };
E.rowsSim=function(A,B,opp){ var r=[], s=opp?1:-1, self=this;
  for(var k=0;k<3;k++){ var a0=A[k],a1=A[(k+1)%3],a2=A[(k+2)%3],b0=B[k],b1=B[(k+1)%3],b2=B[(k+2)%3];
    r.push({v:vec([[1,self.d(a0,a1)],[-1,self.d(a0,a2)],[s,self.d(b0,b1)],[-s,self.d(b0,b2)]]),c:0}); }
  return r; };
E.lrowsSim=function(A,B){ var r=[];
  for(var k=0;k<3;k++){ var a0=A[k],a1=A[(k+1)%3],a2=A[(k+2)%3],b0=B[k],b1=B[(k+1)%3],b2=B[(k+2)%3];
    r.push({v:vec([[1,this.q(a0,a1)],[-1,this.q(a0,a2)],[-1,this.q(b0,b1)],[1,this.q(b0,b2)]]),c:0}); }
  return r; };

/* ---------- facts ---------- */
E.addFact=function(f){
  if(this.fkey[f.key]!==undefined) return null;
  var self=this; f.id=this.facts.length; f.aRows=(f.aRows||[]).filter(function(r){ return r&&self.okA(r); });
  f.lRows=(f.lRows||[]).filter(function(r){ return r&&self.okL(r); });
  f.deps=f.deps||[]; this.facts.push(f); this.fkey[f.key]=f.id;
  f.aRows.forEach(function(r){ self.A.add(r.v,[f.id]); });
  f.lRows.forEach(function(r){ self.L.add(r.v,[f.id]); });
  return f;
};
/* are these rows all implied? returns the set of facts used, or null */
E.need=function(aRows,lRows){
  var s=new Set(), self=this, ok=true;
  (aRows||[]).forEach(function(r){ if(!ok) return; if(!r||!self.okA(r)){ ok=false; return; } var u=self.A.implied(r.v); if(!u){ ok=false; return; } u.forEach(function(x){ s.add(x); }); });
  (lRows||[]).forEach(function(r){ if(!ok) return; if(!r||!self.okL(r)){ ok=false; return; } var u=self.L.implied(r.v); if(!u){ ok=false; return; } u.forEach(function(x){ s.add(x); }); });
  return ok?s:null;
};
/* the angle at v between the rays to a and b, in degrees, and a phrase comparing two such angles */
E.ang=function(a,v,b){ var A=this.pts[a].g,V=this.pts[v].g,B=this.pts[b].g, x1=A.x-V.x,y1=A.y-V.y,x2=B.x-V.x,y2=B.y-V.y;
  return Math.acos(Math.max(-1,Math.min(1,(x1*x2+y1*y2)/(Math.hypot(x1,y1)*Math.hypot(x2,y2)))))*180/Math.PI; };
E.angName=function(a,v,b){ return '\u2220'+this.lab(a)+this.lab(v)+this.lab(b); };
E.angEq=function(p,q){ var u=this.ang(p[0],p[1],p[2]), w=this.ang(q[0],q[1],q[2]);
  return Math.abs(u-w)<1e-6?this.angName(p[0],p[1],p[2])+' = '+this.angName(q[0],q[1],q[2]):this.angName(p[0],p[1],p[2])+' + '+this.angName(q[0],q[1],q[2])+' = 180\u00B0'; };
E.names=function(list){ var self=this; return list.map(function(i){ return self.lab(i); }); };
E.lineName=function(l){ return ln(l); };

/* ---------- what the construction says ---------- */
E.hypotheses=function(){
  var self=this, pts=this.pts, ix=this.ix, n=pts.length, i, j, k;
  var I=function(id){ return ix[id]; };
  var has=function(id){ return ix[id]!==undefined; };
  /* points on each line */
  this.lines.forEach(function(l){
    var m=[]; for(i=0;i<n;i++) if(onLineByConstruction(pts[i],l)) m.push(i);
    self.members[l.id]=m;
    var rows=[]; m.forEach(function(a){ m.forEach(function(b){ if(a<b) rows.push({v:vec([[1,self.d(a,b)],[-1,self.dl(l)]]),c:0}); }); });
    if(rows.length) self.addFact({key:'line:'+l.id,type:'hyp',hyp:true,aRows:rows,text:self.names(m).join(', ')+' lie on '+ln(l)});
  });
  /* points on each circle, and its centre when the figure names one */
  this.circles.forEach(function(c){
    var m=[]; for(i=0;i<n;i++) if(onCircleByConstruction(pts[i],c)) m.push(i);
    self.cmembers[c.id]=m;
    var cen=null;
    if(c.kind==='cp'&&has(c.c)) cen=I(c.c);
    if(c.kind==='circum') objs.forEach(function(z){ if(z.type==='point'&&z.kind==='ccen'&&sameSet(z.of,c.of)&&has(z.id)) cen=I(z.id); });
    if(c.kind==='inc') objs.forEach(function(z){ if(z.type==='point'&&z.kind==='inc'&&sameSet(z.of,c.of)&&has(z.id)) cen=I(z.id); });
    if(m.length>=4){ var rows=[];
      for(var a=0;a<m.length;a++)for(var b=a+1;b<m.length;b++)for(var cc=b+1;cc<m.length;cc++)for(var dd=cc+1;dd<m.length;dd++) rows=rows.concat(self.rowsCyc([m[a],m[b],m[cc],m[dd]]));
      self.addFact({key:'circ:'+c.id,type:'hyp',hyp:true,aRows:rows,text:self.names(m).join(', ')+' lie on '+cn(c)}); }
    if(cen!==null&&m.length>=2) self.centreFact(cen,m,[],'hyp');
  });
  pts.forEach(function(p,pi){
    var of=(p.of||[]);
    switch(p.kind){
      case 'foot': { var l=byId(of[1]); if(has(of[0])&&l) self.addFact({key:'foot:'+p.id,type:'hyp',hyp:true,aRows:[{v:vec([[1,self.d(I(of[0]),pi)],[-1,self.dl(l)]]),c:0.5}],text:p.label+' is the foot of the perpendicular from '+byId(of[0]).label+' to '+ln(l)}); break; }
      case 'refl': { var l2=byId(of[1]); if(!has(of[0])||!l2) break; var x=I(of[0]), ar=[{v:vec([[1,self.d(x,pi)],[-1,self.dl(l2)]]),c:0.5}], lr=[];
        (self.members[l2.id]||[]).forEach(function(qm){ if(qm===pi||qm===x) return; lr.push(self.rowLenEq(qm,pi,qm,x)); ar.push({v:vec([[1,self.d(qm,pi)],[1,self.d(qm,x)],[-2,self.dl(l2)]]),c:0}); });
        self.addFact({key:'refl:'+p.id,type:'hyp',hyp:true,aRows:ar,lRows:lr,text:p.label+' is the reflection of '+byId(of[0]).label+' in '+ln(l2)}); break; }
      case 'reflp': { if(!has(of[0])||!has(of[1])) break; var x2=I(of[0]),z=I(of[1]);
        self.addFact({key:'reflp:'+p.id,type:'hyp',hyp:true,aRows:self.rowsColl(x2,z,pi),lRows:[self.rowLenEq(z,pi,z,x2),{v:vec([[1,self.q(z,pi)],[-1,self.q(x2,pi)]]),c:-Math.log(2)}],text:p.label+' is the reflection of '+byId(of[0]).label+' in '+byId(of[1]).label}); break; }
      case 'mid': { if(!has(of[0])||!has(of[1])) break; var a1=I(of[0]),b1=I(of[1]);
        self.addFact({key:'mid:'+p.id,type:'hyp',hyp:true,aRows:self.rowsColl(a1,pi,b1),lRows:[self.rowLenEq(pi,a1,pi,b1),{v:vec([[1,self.q(pi,a1)],[-1,self.q(a1,b1)]]),c:-Math.log(2)}],text:p.label+' is the midpoint of '+byId(of[0]).label+byId(of[1]).label}); break; }
      case 'ccen': { if(!of.every(has)) break; self.centreFact(pi,of.map(I),[],'hyp'); break; }
      case 'orth': { if(!of.every(has)) break; var t=of.map(I), ar2=[];
        for(k=0;k<3;k++) ar2.push({v:vec([[1,self.d(t[k],pi)],[-1,self.d(t[(k+1)%3],t[(k+2)%3])]]),c:0.5});
        self.addFact({key:'orth:'+p.id,type:'hyp',hyp:true,aRows:ar2,text:p.label+' is the orthocentre of '+self.names(t).join('')}); break; }
      case 'inc': { if(!of.every(has)) break; var t2=of.map(I), ar3=[];
        for(k=0;k<3;k++) ar3.push({v:vec([[2,self.d(t2[k],pi)],[-1,self.d(t2[k],t2[(k+1)%3])],[-1,self.d(t2[k],t2[(k+2)%3])]]),c:0});
        self.addFact({key:'inc:'+p.id,type:'hyp',hyp:true,aRows:ar3,text:p.label+' is the incentre of '+self.names(t2).join('')}); break; }
      case 'cent': { if(!of.every(has)) break; var t3=of.map(I);
        objs.forEach(function(mo){ if(mo.type!=='point'||mo.kind!=='mid'||!has(mo.id)) return;
          for(var v=0;v<3;v++){ var rest=of.filter(function(_,w){return w!==v;}); if(!sameSet(mo.of,rest)) continue;
            var mi=I(mo.id);
            self.addFact({key:'cent:'+p.id+':'+mo.id,type:'hyp',hyp:true,aRows:self.rowsColl(t3[v],pi,mi),lRows:[{v:vec([[1,self.q(t3[v],pi)],[-1,self.q(pi,mi)]]),c:Math.log(2)}],text:p.label+' is the centroid of '+self.names(t3).join('')}); } });
        break; }
    }
  });
  /* lines built from other lines */
  this.lines.forEach(function(l){
    var of=l.of||[];
    if(l.kind==='perp'&&byId(of[1])) self.addFact({key:'lperp:'+l.id,type:'hyp',hyp:true,aRows:[{v:vec([[1,self.dl(l)],[-1,self.dl(byId(of[1]))]]),c:0.5}],text:ln(l)+' is perpendicular to '+ln(byId(of[1]))});
    if(l.kind==='par'&&byId(of[1])) self.addFact({key:'lpar:'+l.id,type:'hyp',hyp:true,aRows:[{v:vec([[1,self.dl(l)],[-1,self.dl(byId(of[1]))]]),c:0}],text:ln(l)+' is parallel to '+ln(byId(of[1]))});
    if(l.kind==='pbis'&&of.every(has)){ var a=I(of[0]),b=I(of[1]), lr=[];
      (self.members[l.id]||[]).forEach(function(x){ if(x!==a&&x!==b) lr.push(self.rowLenEq(x,a,x,b)); });
      self.addFact({key:'pbis:'+l.id,type:'hyp',hyp:true,aRows:[{v:vec([[1,self.dl(l)],[-1,self.d(a,b)]]),c:0.5}],lRows:lr,text:ln(l)+' is the perpendicular bisector of '+byId(of[0]).label+byId(of[1]).label}); }
    if(l.kind==='abis'&&of.every(has)){ var t=of.map(I);
      self.addFact({key:'abis:'+l.id,type:'hyp',hyp:true,aRows:[{v:vec([[2,self.dl(l)],[-1,self.d(t[1],t[0])],[-1,self.d(t[1],t[2])]]),c:0}],text:ln(l)+' bisects angle '+self.names(t).join('')}); }
    if(l.kind==='tan'){ var c=byId(of[1]), T=null; objs.forEach(function(z){ if(z.id===l.b&&has(z.id)) T=I(z.id); });
      if(c&&T!==null){ var ar=[], cm=self.cmembers[c.id]||[];
        var cen=null; if(c.kind==='cp'&&has(c.c)) cen=I(c.c);
        if(c.kind==='circum') objs.forEach(function(z){ if(z.type==='point'&&z.kind==='ccen'&&sameSet(z.of,c.of)&&has(z.id)) cen=I(z.id); });
        if(cen!==null) ar.push({v:vec([[1,self.dl(l)],[-1,self.d(cen,T)]]),c:0.5});
        /* tangent and chord: the angle between the tangent at T and TX equals the inscribed angle on TX */
        cm.forEach(function(x){ cm.forEach(function(y){ if(x===T||y===T||x===y) return;
          var v1=vec([[1,self.dl(l)],[-1,self.d(T,x)],[-1,self.d(y,T)],[1,self.d(y,x)]]), v2=vec([[1,self.dl(l)],[-1,self.d(T,x)],[1,self.d(y,T)],[-1,self.d(y,x)]]);
          if(nearC(self.aValue(v1),0)) ar.push({v:v1,c:0}); else if(nearC(self.aValue(v2),0)) ar.push({v:v2,c:0}); }); });
        self.addFact({key:'tan:'+l.id,type:'hyp',hyp:true,aRows:ar,text:ln(l)+' is tangent to '+cn(c)+' at '+self.lab(T)}); } }
  });
};

/* X is the centre of a circle through the points in S: equal distances, central angles, and concyclicity */
E.centreFact=function(x,S,deps,reason){
  S=S.filter(function(s){ return s!==x; }).slice().sort(function(a,b){return a-b;});
  if(S.length<2) return null;
  var key='centre:'+x+':'+S.join(','), self=this;
  if(this.fkey[key]!==undefined) return null;
  /* a larger set already known about x makes this one redundant */
  var prev=this.centreOf[x]; if(prev&&S.every(function(s){ return prev.indexOf(s)>=0; })) return null;
  var lr=[], ar=[];
  for(var i=1;i<S.length;i++) lr.push(this.rowLenEq(x,S[0],x,S[i]));
  for(i=0;i<S.length;i++)for(var j=i+1;j<S.length;j++){ ar.push(this.rowIso(x,S[i],S[j]));
    for(var k=0;k<S.length;k++){ if(k===i||k===j) continue; ar.push(this.rowCentre(x,S[i],S[j],S[k])); } }
  if(S.length>=4) for(var a=0;a<S.length;a++)for(var b=a+1;b<S.length;b++)for(var c=b+1;c<S.length;c++)for(var d=c+1;d<S.length;d++) ar=ar.concat(this.rowsCyc([S[a],S[b],S[c],S[d]]));
  this.centreOf[x]=S;
  var txt=S.length>=3?this.lab(x)+' is the centre of the circle through '+this.names(S).join(', '):this.lab(x)+this.lab(S[0])+' = '+this.lab(x)+this.lab(S[1]);
  return this.addFact({key:key,type:S.length>=3?'centre':'cong',hyp:reason==='hyp',args:[x].concat(S),aRows:ar,lRows:lr,deps:deps,reason:reason,text:txt});
};

/* ---------- statements worth trying: those true in the figure ---------- */
E.candidates=function(){
  var self=this, pts=this.pts, n=pts.length, out=[], i,j,k,m, tol=this.D*1e-7;
  var G=function(i){ return pts[i].g; };
  /* collinear triples */
  for(i=0;i<n;i++)for(j=i+1;j<n;j++)for(k=j+1;k<n;k++){ var a=G(i),b=G(j),c=G(k);
    if(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/Math.max(1e-9,Math.hypot(b.x-a.x,b.y-a.y))<tol) out.push({type:'coll',t:[i,j,k]}); }
  /* parallel and perpendicular directions, among lines through two points and line objects */
  var dirs=[]; for(i=0;i<n;i++)for(j=i+1;j<n;j++) dirs.push({v:this.d(i,j),i:i,j:j});
  this.lines.forEach(function(l){ dirs.push({v:self.dl(l),l:l}); });
  dirs.forEach(function(d){ d.P=d.l?(self.members[d.l.id]||[]):[d.i,d.j]; });
  for(i=0;i<dirs.length;i++)for(j=i+1;j<dirs.length;j++){
    if(dirs[i].v===dirs[j].v) continue;
    var shareP=dirs[i].P.some(function(x){ return dirs[j].P.indexOf(x)>=0; });
    var dv=mod1(this.aval[dirs[i].v]-this.aval[dirs[j].v]);
    if(shareP&&Math.min(dv,1-dv)<1e-9) continue;          /* same line through a common point: a collinearity, handled above */
    if(Math.min(dv,1-dv)<1e-9) out.push({type:'para',u:dirs[i],w:dirs[j]});
    else if(Math.abs(dv-0.5)<1e-9) out.push({type:'perp',u:dirs[i],w:dirs[j]});
  }
  /* concyclic quadruples */
  for(i=0;i<n;i++)for(j=i+1;j<n;j++)for(k=j+1;k<n;k++){ var cr=circum(G(i),G(j),G(k)); if(!isFinite(cr.r)||cr.r>this.D*50) continue;
    for(m=k+1;m<n;m++) if(Math.abs(Math.hypot(G(m).x-cr.cx,G(m).y-cr.cy)-cr.r)<tol){
      var q4=[i,j,k,m], flat3=[[0,1,3],[0,2,3],[1,2,3]].some(function(t){ var a=G(q4[t[0]]),b=G(q4[t[1]]),c=G(q4[t[2]]); return Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))<self.D*self.D*1e-9; });
      if(!flat3) out.push({type:'cyc',t:q4}); } }
  /* equal lengths */
  var S=[]; for(i=0;i<n;i++)for(j=i+1;j<n;j++) S.push({i:i,j:j,v:Math.hypot(G(i).x-G(j).x,G(i).y-G(j).y)});
  S.sort(function(a,b){return a.v-b.v;});
  for(i=0;i<S.length;i++)for(j=i+1;j<S.length&&S[j].v-S[i].v<tol;j++) out.push({type:'cong',s:S[i],t:S[j]});
  /* equal distances from one point: circles through three or more points */
  this.rings=[];
  for(i=0;i<n;i++){ var ds=[]; for(j=0;j<n;j++) if(j!==i) ds.push({j:j,v:Math.hypot(G(i).x-G(j).x,G(i).y-G(j).y)});
    ds.sort(function(a,b){return a.v-b.v;});
    for(j=0;j<ds.length;){ var g=[ds[j].j]; k=j+1; while(k<ds.length&&ds[k].v-ds[j].v<tol){ g.push(ds[k].j); k++; } if(g.length>=2) this.rings.push({x:i,S:g}); j=k; } }
  /* similar triangles */
  this.simCands(out);
  return out;
};
E.simCands=function(out){
  var pts=this.pts, n=pts.length, T=[], i,j,k;
  if(n>16) return;
  for(i=0;i<n;i++)for(j=i+1;j<n;j++)for(k=j+1;k<n;k++){ var a=pts[i].g,b=pts[j].g,c=pts[k].g, s=[Math.hypot(b.x-c.x,b.y-c.y),Math.hypot(a.x-c.x,a.y-c.y),Math.hypot(a.x-b.x,a.y-b.y)], mx=Math.max(s[0],s[1],s[2]);
    if(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))<mx*mx*2e-3) continue; T.push({v:[i,j,k],s:s,mx:mx}); }
  var PERMS=[[0,1,2],[1,0,2],[0,2,1],[2,0,1],[1,2,0],[2,1,0]], Es=[];
  T.forEach(function(t,ti){ PERMS.forEach(function(p){ if(t.s[p[2]]<t.mx*(1-1e-6)) return;
    var A=pts[t.v[p[0]]].g,B=pts[t.v[p[1]]].g,C=pts[t.v[p[2]]].g, ux=B.x-A.x,uy=B.y-A.y,vx=C.x-A.x,vy=C.y-A.y,dd=ux*ux+uy*uy;
    var re=(vx*ux+vy*uy)/dd, im=(vy*ux-vx*uy)/dd; Es.push({ti:ti,p:p,f:0,re:re,im:im}); Es.push({ti:ti,p:p,f:1,re:re,im:-im}); }); });
  Es.sort(function(x,y){return x.re-y.re;});
  var seen={};
  for(i=0;i<Es.length;i++){ var e1=Es[i]; if(e1.f) continue;
    for(j=i+1;j<Es.length&&Es[j].re-e1.re<1e-6;j++){ var e2=Es[j]; if(e2.ti===e1.ti||Math.abs(e2.im-e1.im)>=1e-6) continue;
      var A=e1.p.map(function(q){return T[e1.ti].v[q];}), B=e2.p.map(function(q){return T[e2.ti].v[q];});
      var key=A.join(',')+'|'+B.join(','); if(seen[key]) continue; seen[key]=1;
      out.push({type:'sim',A:A,B:B,opp:e1.f!==e2.f}); } }
};

/* ---------- saturation ---------- */
E.dirName=function(d){ return d.l?ln(d.l):this.lab(d.i)+this.lab(d.j); };
E.tryCand=function(c){
  var self=this, s, f;
  switch(c.type){
    case 'coll': {
      var key='coll:'+c.t.join(','); if(this.fkey[key]!==undefined) return false;
      /* two lines through a common point with the same direction are one line, so any one equality is enough */
      var rows=this.rowsColl(c.t[0],c.t[1],c.t[2]), t0=c.t, alt=[rows[0],rows[1],{v:vec([[1,this.d(t0[0],t0[2])],[-1,this.d(t0[1],t0[2])]]),c:0}], used=null;
      for(var ai=0;ai<3&&!s;ai++){ s=this.need([alt[ai]]); if(s) used=alt[ai]; }
      if(!s) return false;
      f=this.addFact({key:key,type:'coll',args:c.t,aRows:alt,deps:Array.from(s),need:{a:[used]},reason:'angle chase',text:this.names(c.t).join(', ')+' are collinear'});
      return !!f; }
    case 'para': case 'perp': {
      var key2=c.type+':'+c.u.v+','+c.w.v; if(this.fkey[key2]!==undefined) return false;
      var row={v:vec([[1,c.u.v],[-1,c.w.v]]),c:c.type==='perp'?0.5:0}; s=this.need([row]); if(!s) return false;
      /* skip the empty kind: two names for the same line */
      if(c.type==='para'&&Object.keys(row.v).length===0) return false;
      f=this.addFact({key:key2,type:c.type,args:[c.u,c.w],aRows:[row],deps:Array.from(s),need:{a:[row]},reason:'angle chase',text:this.dirName(c.u)+(c.type==='perp'?' ⟂ ':' ∥ ')+this.dirName(c.w)});
      return !!f; }
    case 'cyc': {
      var key3='cyc:'+c.t.join(','); if(this.fkey[key3]!==undefined) return false;
      /* each of the six equal-angle equations says the same thing on its own (no three of the points are collinear) */
      var rs=this.rowsCyc(c.t), ri=-1; for(var z=0;z<rs.length&&!s;z++){ s=this.need([rs[z]]); if(s) ri=z; }
      if(!s) return false;
      var CH=[[0,1,2,3],[0,2,1,3],[0,3,1,2],[2,3,0,1],[1,3,0,2],[1,2,0,3]][ri], q=c.t.map(function(_,w){ return c.t[CH[w]]; }), why3=this.angEq([q[0],q[2],q[1]],[q[0],q[3],q[1]]);
      f=this.addFact({key:key3,type:'cyc',args:c.t,aRows:rs,deps:Array.from(s),need:{a:[rs[ri]]},reason:(why3.indexOf('180')>=0?'opposite angles: ':'angles on the same chord: ')+why3,text:this.names(c.t).join(', ')+' are concyclic'});
      return !!f; }
    case 'cong': {
      var a=c.s, b=c.t, key4='cong:'+[a.i+'_'+a.j,b.i+'_'+b.j].sort().join(','); if(this.fkey[key4]!==undefined) return false;
      var lr=this.rowLenEq(a.i,a.j,b.i,b.j), shared=[a.i,a.j].filter(function(x){return x===b.i||x===b.j;})[0];
      var ar=[], x, p, q;
      if(shared!==undefined){ x=shared; p=a.i===x?a.j:a.i; q=b.i===x?b.j:b.i; ar.push(this.rowIso(x,p,q)); }
      var txt=this.lab(a.i)+this.lab(a.j)+' = '+this.lab(b.i)+this.lab(b.j);
      s=this.need(null,[lr]);
      if(s){ f=this.addFact({key:key4,type:'cong',args:[a,b],aRows:ar,lRows:[lr],deps:Array.from(s),need:{l:[lr]},reason:'lengths',text:txt}); return !!f; }
      /* base angles say nothing when the three points are on one line */
      var flat=shared!==undefined&&(function(){ var A=self.pts[x].g,B=self.pts[p].g,C=self.pts[q].g; return Math.abs((B.x-A.x)*(C.y-A.y)-(B.y-A.y)*(C.x-A.x))<self.D*self.D*1e-9; })();
      if(ar.length&&!flat){ s=this.need(ar); if(s){ f=this.addFact({key:key4,type:'cong',args:[a,b],aRows:ar,lRows:[lr],deps:Array.from(s),need:{a:ar},reason:'equal base angles '+this.angName(x,p,q)+' = '+this.angName(p,q,x),text:txt}); return !!f; } }
      return false; }
    case 'sim': {
      var key5='sim:'+c.A.join(',')+'|'+c.B.join(','); if(this.fkey[key5]!==undefined) return false;
      /* row k of each list is about vertex k: the angle there, and the ratio of the two sides that meet there */
      var arS=this.rowsSim(c.A,c.B,c.opp), lrS=this.lrowsSim(c.A,c.B), ga=[], gl=[], why=null, needA=[], needL=[];
      arS.forEach(function(r,k){ ga[k]=self.need([r]); });
      lrS.forEach(function(r,k){ gl[k]=self.need(null,[r]); });
      var pick=function(list){ s=new Set(); list.forEach(function(u){ u.forEach(function(z){ s.add(z); }); }); };
      var ka=[0,1,2].filter(function(k){return ga[k];}), kl=[0,1,2].filter(function(k){return gl[k];});
      if(ka.length>=2){ why='two equal angles'; needA=[arS[ka[0]],arS[ka[1]]]; pick([ga[ka[0]],ga[ka[1]]]); }
      else if(kl.length>=2){ why='sides in proportion'; needL=[lrS[kl[0]],lrS[kl[1]]]; pick([gl[kl[0]],gl[kl[1]]]); }
      else { var both=[0,1,2].filter(function(k){ return ga[k]&&gl[k]; });
        if(both.length){ var k0=both[0]; why='an equal angle between proportional sides'; needA=[arS[k0]]; needL=[lrS[k0]]; pick([ga[k0],gl[k0]]); } }
      if(!why) return false;
      var A0=c.A, B0=c.B, det=[];
      needA.forEach(function(r){ var k=arS.indexOf(r); det.push(self.angEq([A0[(k+1)%3],A0[k],A0[(k+2)%3]],[B0[(k+1)%3],B0[k],B0[(k+2)%3]])); });
      needL.forEach(function(r){ var k=lrS.indexOf(r); det.push(self.lab(A0[k])+self.lab(A0[(k+1)%3])+' : '+self.lab(A0[k])+self.lab(A0[(k+2)%3])+' = '+self.lab(B0[k])+self.lab(B0[(k+1)%3])+' : '+self.lab(B0[k])+self.lab(B0[(k+2)%3])); });
      why+=', '+det.join(' and ');
      f=this.addFact({key:key5,type:'sim',args:[c.A,c.B,c.opp],aRows:arS,lRows:lrS,deps:Array.from(s),need:{a:needA,l:needL},reason:why,text:'△'+this.names(c.A).join('')+' ∼ △'+this.names(c.B).join('')});
      return !!f; }
  }
  return false;
};
/* rings: X equidistant from a set; grow the set by length chasing or by the central angle */
E.tryRings=function(){
  var self=this, any=false;
  (this.rings||[]).forEach(function(r){
    var x=r.x, S=r.S, known=[], deps=new Set(), base=null, needA=[], needL=[];
    for(var i=0;i<S.length&&base===null;i++){ for(var j=i+1;j<S.length;j++){ var u=self.need(null,[self.rowLenEq(x,S[i],x,S[j])]); if(u){ base=S[i]; break; } } }
    if(base===null) return;
    S.forEach(function(s){ if(s===base){ known.push(s); return; } var lr=self.rowLenEq(x,base,x,s), u=self.need(null,[lr]); if(u){ known.push(s); needL.push(lr); u.forEach(function(z){deps.add(z);}); } });
    /* central angle: once two points are known, a third is on the circle when the angle at the centre is right */
    var reason='equal distances';
    if(known.length>=2) S.forEach(function(s){ if(known.indexOf(s)>=0) return;
      var row=self.rowCentre(x,known[0],known[1],s); if(!row) return; var u=self.need([row]); if(u){ known.push(s); needA.push(row); u.forEach(function(z){deps.add(z);}); reason='angle at the centre'; } });
    if(known.length>=2){ var f=self.centreFact(x,known,Array.from(deps),reason); if(f){ f.need={a:needA,l:needL}; any=true; } }
  });
  /* points equidistant from the same two points lie on one line, perpendicular to the segment */
  var byPair={};
  var put=function(x,p,q,fid){ var k=Math.min(p,q)+'_'+Math.max(p,q); (byPair[k]=byPair[k]||[]).push({x:x,f:fid}); };
  this.facts.forEach(function(f){ var a=f.args; if(!a) return;
    if(f.key.indexOf('centre:')===0){ var x=a[0], S=a.slice(1); for(var i=0;i<S.length;i++)for(var j=i+1;j<S.length;j++) put(x,S[i],S[j],f.id); }
    else if(f.type==='cong'){ var s1=a[0], s2=a[1], sh=[s1.i,s1.j].filter(function(z){return z===s2.i||z===s2.j;})[0];
      if(sh!==undefined) put(sh, s1.i===sh?s1.j:s1.i, s2.i===sh?s2.j:s2.i, f.id); } });
  Object.keys(byPair).forEach(function(k){ var L=byPair[k]; if(L.length<2) return; var ab=k.split('_').map(Number);
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){ var X=L[i].x, Y=L[j].x; if(X===Y) continue;
      var key='pb:'+Math.min(X,Y)+'_'+Math.max(X,Y)+':'+k; if(self.fkey[key]!==undefined) continue;
      var row={v:vec([[1,self.d(X,Y)],[-1,self.d(ab[0],ab[1])]]),c:0.5};
      if(!self.okA(row)) continue;
      var f=self.addFact({key:key,type:'perp',args:[{i:X,j:Y},{i:ab[0],j:ab[1]}],aRows:[row],deps:[L[i].f,L[j].f],need:{l:[self.rowLenEq(X,ab[0],X,ab[1]),self.rowLenEq(Y,ab[0],Y,ab[1])],pb:{a:[row]}},reason:'both equidistant from '+self.lab(ab[0])+' and '+self.lab(ab[1]),text:self.lab(X)+self.lab(Y)+' ⟂ '+self.lab(ab[0])+self.lab(ab[1])});
      if(f) any=true; } });
  return any;
};
E.saturate=function(goal,budgetMs){
  var t0=Date.now(), cands=this.candidates(), rounds=0;
  while(rounds<20){ rounds++; var any=false;
    for(var i=0;i<cands.length;i++){ if(cands[i].done) continue; if(this.tryCand(cands[i])){ cands[i].done=true; any=true; if(goal&&this.goalMet(goal)) return true; } }
    if(this.tryRings()) any=true;
    if(goal&&this.goalMet(goal)) return true;
    if(!any||Date.now()-t0>(budgetMs||4000)) break; }
  return goal?this.goalMet(goal):false;
};

/* ---------- goals, from the sandbox's relation keys ---------- */
E.goalFrom=function(key){
  var self=this, ix=this.ix, k=key.split(':'), type=k[0];
  var byLabel=function(l){ var p=self.pts.filter(function(q){return q.label===l;})[0]; return p?ix[p.id]:undefined; };
  var line=function(id){ return objs.filter(function(o){return o.type==='line'&&o.id===+id;})[0]; };
  var g={a:[],l:[],key:key};
  if(type==='perp'||type==='par'){ var ids=k[1].split(','), l1=line(ids[0]), l2=line(ids[1]); if(!l1||!l2) return null;
    g.a.push({v:vec([[1,this.dl(l1)],[-1,this.dl(l2)]]),c:type==='perp'?0.5:0}); g.text=ln(l1)+(type==='perp'?' ⟂ ':' ∥ ')+ln(l2); return g; }
  if(type==='col'){ var t=k[1].split(',').map(byLabel); if(t.some(function(x){return x===undefined;})) return null;
    var cr=this.rowsColl(t[0],t[1],t[2]); g.alts=[[cr[0]],[cr[1]],[{v:vec([[1,this.d(t[0],t[2])],[-1,this.d(t[1],t[2])]]),c:0}]]; g.a=g.alts[0]; g.text=k[1].split(',').join(', ')+' are collinear'; return g; }
  if(type==='cyc'){ var t2=k[1].split(',').map(byLabel); if(t2.some(function(x){return x===undefined;})) return null;
    g.alts=this.rowsCyc(t2).map(function(r){ return [r]; }); g.a=g.alts[0]; g.text=k[1].split(',').join(', ')+' are concyclic'; return g; }
  if(type==='onl'){ var p=byLabel(k[1]), l=line(k[2]); if(p===undefined||!l) return null; var m=(this.members[l.id]||[]).filter(function(x){return x!==p;});
    if(!m.length) return null; g.a.push({v:vec([[1,this.d(p,m[0])],[-1,this.dl(l)]]),c:0}); g.text=k[1]+' lies on '+ln(l); return g; }
  if(type==='onc'){ var p2=byLabel(k[1]), c=objs.filter(function(o){return o.type==='circle'&&o.id===+k[2];})[0]; if(p2===undefined||!c) return null;
    var cm=(this.cmembers[c.id]||[]).filter(function(x){return x!==p2;});
    if(cm.length>=3){ g.alts=this.rowsCyc([cm[0],cm[1],cm[2],p2]).map(function(r){ return [r]; }); g.a=g.alts[0]; }
    else { var cen=null; if(c.kind==='cp') cen=ix[c.c]; if(cen===undefined||cen===null||!cm.length) return null; g.l.push(this.rowLenEq(cen,cm[0],cen,p2)); }
    g.text=k[1]+' lies on '+cn(c); return g; }
  /* tangency: the radius to the point of contact is perpendicular, or the tangent-chord angle when no centre is named */
  if(type==='tan'){ var ids3=k[1].split(','), lt=line(ids3[0]), ct=objs.filter(function(o){return o.type==='circle'&&o.id===+ids3[1];})[0]; if(!lt||!ct) return null;
    var lm=this.members[lt.id]||[], cmm=this.cmembers[ct.id]||[], T=lm.filter(function(x){ return cmm.indexOf(x)>=0; })[0]; if(T===undefined) return null;
    var cen2=null; if(ct.kind==='cp'&&ix[ct.c]!==undefined) cen2=ix[ct.c];
    if(ct.kind==='circum') objs.forEach(function(z){ if(z.type==='point'&&z.kind==='ccen'&&sameSet(z.of,ct.of)&&ix[z.id]!==undefined) cen2=ix[z.id]; });
    if(ct.kind==='inc') objs.forEach(function(z){ if(z.type==='point'&&z.kind==='inc'&&sameSet(z.of,ct.of)&&ix[z.id]!==undefined) cen2=ix[z.id]; });
    if(cen2!==null) g.a.push({v:vec([[1,this.d(cen2,T)],[-1,this.dl(lt)]]),c:0.5});
    else { var oth=cmm.filter(function(x){return x!==T;}); if(oth.length<2) return null;
      var v1=vec([[1,this.dl(lt)],[-1,this.d(T,oth[0])],[-1,this.d(oth[1],T)],[1,this.d(oth[1],oth[0])]]), v2=vec([[1,this.dl(lt)],[-1,this.d(T,oth[0])],[1,this.d(oth[1],T)],[-1,this.d(oth[1],oth[0])]]);
      g.a.push(nearC(this.aValue(v1),0)?{v:v1,c:0}:{v:v2,c:0}); }
    g.text=ln(lt)+' is tangent to '+cn(ct); return g; }
  if(type==='eq'){ var segs=k[1].split(',').map(function(s){ for(var i=1;i<s.length;i++){ var a=byLabel(s.slice(0,i)), b=byLabel(s.slice(i)); if(a!==undefined&&b!==undefined) return [a,b]; } return null; });
    if(segs.some(function(s){return !s;})) return null;
    for(var i=1;i<segs.length;i++) g.l.push(this.rowLenEq(segs[0][0],segs[0][1],segs[i][0],segs[i][1])); g.text=k[1].split(',').join(' = '); return g; }
  if(type==='sim'){ var q=k[1].split('|'), A=q[0].split(',').map(byLabel), B=q[1].split(',').map(byLabel); if(A.concat(B).some(function(x){return x===undefined;})) return null;
    g.a=this.rowsSim(A,B,q[2]==='o').slice(0,2); g.text='△'+q[0].split(',').join('')+' ∼ △'+q[1].split(',').join(''); return g; }
  if(type==='con'){ var ids2=k[1].split(',').map(line); if(ids2.some(function(x){return !x;})) return null;
    for(var a=0;a<3;a++){ var l1b=ids2[a], l2b=ids2[(a+1)%3], l3=ids2[(a+2)%3];
      var X=this.pts.map(function(_,i){return i;}).filter(function(i){ return onLineByConstruction(self.pts[i],l1b)&&onLineByConstruction(self.pts[i],l2b); })[0];
      if(X===undefined) continue; var m3=(this.members[l3.id]||[]).filter(function(x){return x!==X;}); if(!m3.length) continue;
      g.a.push({v:vec([[1,this.d(X,m3[0])],[-1,this.dl(l3)]]),c:0}); g.text='lines '+ids2.map(ln).join(', ')+' are concurrent'; return g; }
    return null; }
  return null;
};
/* a goal with several equivalent forms is met when any one form follows; that form is then the goal */
E.goalMet=function(g){
  if(g.alts){ for(var i=0;i<g.alts.length;i++) if(this.need(g.alts[i],g.l)){ g.a=g.alts[i]; return true; } return false; }
  return !!this.need(g.a,g.l); };

/* ---------- the proof: keep only the facts the goal needs ---------- */
E.proof=function(g){
  var self=this, hyps=this.facts.filter(function(f){return f.hyp;}).map(function(f){return f.id;});
  /* does `need` follow from the hypotheses and these derived facts? */
  var follows=function(need,ids){ var A=new Span(), L=new Span();
    hyps.concat(ids).forEach(function(id){ var f=self.facts[id]; f.aRows.forEach(function(r){ A.add(r.v,[id]); }); f.lRows.forEach(function(r){ L.add(r.v,[id]); }); });
    return (need.a||[]).every(function(r){ return A.implied(r.v); })&&(need.l||[]).every(function(r){ return L.implied(r.v); }); };
  /* the facts a step may rest on: everything its equations were built from, derived ones only */
  var closure=function(ids){ var seen={}, st=ids.slice(), out=[];
    while(st.length){ var id=st.pop(); if(seen[id]) continue; seen[id]=1; var f=self.facts[id]; if(!f.hyp) out.push(id); (f.deps||[]).forEach(function(d){ st.push(d); }); }
    return out.sort(function(a,b){return a-b;}); };
  var derivedBefore=function(id){ return closure(self.facts[id].deps||[]).filter(function(x){return x<id;}); };
  var minimal=function(need,pool){ var keep=pool.slice();
    for(var i=keep.length-1;i>=0;i--){ var trial=keep.slice(0,i).concat(keep.slice(i+1)); if(follows(need,trial)) keep=trial; }
    return keep; };
  var used={}, order=[];
  var visit=function(need,pool){ var m=minimal(need,pool);
    m.forEach(function(id){ if(used[id]) return; used[id]=1; var f=self.facts[id];
      visit(f.need||{},derivedBefore(id)); order.push(id); }); };
  if(!this.goalMet(g)) return null;
  var src=this.need(g.a,g.l); if(!src) return null;
  visit({a:g.a,l:g.l},closure(Array.from(src)));
  var seen={}; order=order.filter(function(id){ if(seen[id]) return false; seen[id]=1; return true; }).sort(function(a,b){return a-b;});
  /* the givens each step rests on, kept to a smallest set */
  var givens=function(need,derived){ var keep=hyps.slice();
    var ok=function(H){ var A=new Span(), L=new Span();
      H.concat(derived).forEach(function(id){ var f=self.facts[id]; f.aRows.forEach(function(r){ A.add(r.v,[id]); }); f.lRows.forEach(function(r){ L.add(r.v,[id]); }); });
      return (need.a||[]).every(function(r){ return A.implied(r.v); })&&(need.l||[]).every(function(r){ return L.implied(r.v); }); };
    for(var i=keep.length-1;i>=0;i--){ var t=keep.slice(0,i).concat(keep.slice(i+1)); if(ok(t)) keep=t; }
    return keep.map(function(id){ return self.facts[id].text; }); };
  var steps=order.map(function(id){ var f=self.facts[id]; f.using=givens(f.need||{},order.filter(function(x){return x<id;})); return f; });
  this.finalUsing=givens({a:g.a,l:g.l},order);
  return steps;
};

global.GeoProver={Engine:Engine,Span:Span};
})(window);
