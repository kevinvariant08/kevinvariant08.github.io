/* Kevinvariant sandbox: import tkz-euclide code.
   Each command becomes the matching sandbox construction (a foot stays a foot, a second intersection stays
   a second intersection), so relations, hints and the prover can use what the construction says. Points the
   code never labels are kept as hidden helpers. Commands with no construction behind them (radii given as
   numbers, say) are listed back to the user rather than guessed. */
window.TKZ=(function(){
  var S=55, OX=420, OY=320;                         /* cm -> canvas */
  function norm(x){ return String(x).replace(/\\prime/g,"'").replace(/[_{}\\ $]/g,''); }
  function evalNum(e,vars){
    var s=String(e).trim(); Object.keys(vars).forEach(function(k){ s=s.split('\\'+k).join('('+vars[k]+')'); });
    s=s.replace(/\bcos\(/g,'cosd(').replace(/\bsin\(/g,'sind(').replace(/\btan\(/g,'tand(').replace(/\bsqrt\(/g,'Math.sqrt(').replace(/\bpi\b/g,'Math.PI').replace(/\^/g,'**').replace(/\{|\}/g,'');
    if(/[^0-9+\-*/().,\sA-Za-z_]/.test(s)) throw 'expression '+e;
    var okNames={cosd:1,sind:1,tand:1,Math:1,sqrt:1,PI:1,abs:1}; (s.match(/[A-Za-z_]+/g)||[]).forEach(function(w){ if(!okNames[w]) throw 'expression '+e; });
    s=s.replace(/\babs\(/g,'Math.abs(');
    var cosd=function(a){return Math.cos(a*Math.PI/180);}, sind=function(a){return Math.sin(a*Math.PI/180);}, tand=function(a){return Math.tan(a*Math.PI/180);};
    var v=Function('cosd','sind','tand','return ('+s+');')(cosd,sind,tand); if(!isFinite(v)) throw 'expr'; return v; }
  /* drawing options: xcolor names onto the sandbox palette (which has light-mode twins), dashes and weights */
  function style(opt){ var o={book:true,w:1.4}; opt=String(opt||'');
    var c=(/(?:color\s*=\s*)?\b(black|gray|grey|red|blue|cyan|teal|green|purple|violet|magenta|orange|brown|olive|lime)\b/.exec(opt)||[])[1];
    var map={red:'#FF6B8B',blue:'#4FD8E8',cyan:'#4FD8E8',teal:'#4FD8E8',green:'#5BE3A6',lime:'#5BE3A6',olive:'#5BE3A6',purple:'#B38CFF',violet:'#B38CFF',magenta:'#B38CFF',orange:'#FFB86B',brown:'#FFB86B',gray:'#8A89BD',grey:'#8A89BD'};
    if(c&&map[c]) o.col=map[c];
    if(/dashed|dotted/.test(opt)) o.dash=true;
    if(/very thick|ultra thick/.test(opt)) o.w=2.4; else if(/\bthick\b/.test(opt)) o.w=1.9;
    return o; }
  function args(s){ /* split "A,B" or "A,B C,D" */ return s.split(',').map(function(t){return t.trim();}).filter(Boolean); }
  function build(code){
    reset();
    var P={}, unsupported=[], vars={}, labelled={}, lineMap={}, drawnSeg=[], drawnCirc=[];
    var pt=function(n){ var id=P[norm(n)]; if(id===undefined) throw 'unknown point '+n; return id; };
    /* matching ignores braces and underscores; the label keeps the underscore so O_1 still shows as a subscript */
    var name=function(o,n){ o.label=String(n).replace(/\\prime/g,"'").replace(/[{}\\ $]/g,''); P[norm(n)]=o.id; };
    var lineFor=function(a,b){ var k1=norm(a)+'|'+norm(b), k2=norm(b)+'|'+norm(a); if(lineMap[k1]) return lineMap[k1]; if(lineMap[k2]) return lineMap[k2];
      var A=pt(a),B=pt(b); var ex=objs.filter(function(o){return o.type==='line'&&o.kind==='two'&&sameSet([o.a,o.b],[A,B]);})[0]; if(ex) return ex.id;
      var o=add({type:'line',kind:'two',style:'line',a:A,b:B,invis:true}); return o.id; };
    var circleFor=function(c,t){ var C=pt(c),T=pt(t), cp=byId(C);
      if(cp.kind==='ccen'){ var ci=objs.filter(function(o){return o.type==='circle'&&o.kind==='circum'&&sameSet(o.of,cp.of);})[0]; if(ci) return ci.id;
        if(cp.of.indexOf(T)>=0) return add({type:'circle',kind:'circum',of:cp.of.slice(),invis:true}).id; }
      if(cp.kind==='inc'){ var ic=objs.filter(function(o){return o.type==='circle'&&o.kind==='inc'&&sameSet(o.of,cp.of);})[0]; if(ic) return ic.id; }
      var ex=objs.filter(function(o){return o.type==='circle'&&o.kind==='cp'&&o.c===C&&o.t===T;})[0]; if(ex) return ex.id;
      return add({type:'circle',kind:'cp',c:C,t:T,invis:true}).id; };
    /* two new intersection points: prefer the reading in which a root that is already a named point keeps its name */
    var twoRoots=function(kind,of,names,opts){   /* opts.first: the line's first point, for tkz-euclide's root order */
      var p0=add({type:'point',kind:kind,of:of,idx:0}), p1=add({type:'point',kind:kind,of:of,idx:1}); compute();
      var existing=function(p){ return objs.filter(function(q){ return q.type==='point'&&q!==p0&&q!==p1&&q.g&&isFinite(q.g.x)&&Math.hypot(q.g.x-p.g.x,q.g.y-p.g.y)<1e-6; })[0]; };
      var e0=existing(p0), e1=existing(p1), ord=[p0,p1];
      var named=names.filter(function(n){return n;});
      if(opts&&opts.common){ var cm=pt(opts.common); if(e0&&e0.id===cm) ord=[p1,p0]; }
      else if(named.length===1){ /* one new name: it belongs to the root that is not already a point of the figure */
        var slot=names[0]?0:1, other=1-slot;
        if(e0&&!e1) ord=slot===0?[p1,p0]:[p0,p1]; else if(e1&&!e0) ord=slot===0?[p0,p1]:[p1,p0]; }
      else if(e0&&!e1&&norm(names[0]||'')===norm(e0.label)) ord=[p0,p1]; else if(e1&&!e0&&norm(names[0]||'')===norm(e1.label)) ord=[p1,p0];
      else if(opts&&opts.first!==undefined){ /* tkz-euclide lists line-circle roots from the line's first point */
        var F0=byId(opts.first).g, d0=Math.hypot(p0.g.x-F0.x,p0.g.y-F0.y), d1=Math.hypot(p1.g.x-F0.x,p1.g.y-F0.y); ord=d0<=d1?[p0,p1]:[p1,p0]; }
      else if(opts&&opts.c1!==undefined){ /* tkz-euclide lists circle-circle roots with the first to the left of the line of centres */
        var O1=byId(opts.c1).g, O2=byId(opts.c2).g, side=function(p){ return (O2.x-O1.x)*(p.g.y-O1.y)-(O2.y-O1.y)*(p.g.x-O1.x); };
        ord=side(p0)<side(p1)?[p0,p1]:[p1,p0]; }   /* canvas y points down, so "left" has the smaller cross product */
      else if(e0&&!e1) ord=[p1,p0];
      names.forEach(function(n,i){ if(!n) return; var e=existing(ord[i]); if(e&&norm(e.label)===norm(n)){ ord[i].hidden=true; return; } name(ord[i],n); });
      ord.slice(names.length).forEach(function(p){ p.hidden=true; });
      ord.forEach(function(p){ if(!p.label) p.hidden=true; });
    };
    var stmts=code.replace(/%[^\n]*/g,'').split(/(?=\\tkz(?!Get)|\\pgfmathsetmacro|\\def\\|\\coordinate|\\draw|\\fill|\\node|\\begin|\\end|\\path|\\filldraw|\\clip)/);
    stmts.forEach(function(st){ st=st.trim(); if(!st) return; var m;
      try{
      if((m=/^\\pgfmathsetmacro\{?\\(\w+)\}?\{([^}]*)\}/.exec(st))){ vars[m[1]]=evalNum(m[2],vars); return; }
      /* plain TikZ coordinates: numbers become free points, calc forms become constructions */
      if(/^\\coordinate/.test(st)){
        st.split(/(?=\\coordinate)/).forEach(function(cs){ var mm=/\\coordinate\s*\(([^)]*)\)\s*at\s*\((.*)\)\s*;/.exec(cs); if(!mm) return; var nm=mm[1].trim(), ex=mm[2].trim(), k;
          if((k=/^\$\(([^)]*)\)!([^!]*)!\(([^)]*)\)\$$/.exec(ex))){ name(add({type:'point',kind:'lin',of:[pt(k[1]),pt(k[3])],k:evalNum(k[2],vars)}),nm); return; }
          if((k=/^\$\(([^)]*)\)!([^!]*)!([-+]?90):\(([^)]*)\)\$$/.exec(ex))){ var kk=evalNum(k[2],vars); name(add({type:'point',kind:'orthk',of:[pt(k[1]),pt(k[4])],k:k[3].charAt(0)==='-'?kk:-kk}),nm); return; }
          var parts=ex.split(/,(?![^()]*\))/); if(parts.length!==2) throw 'coordinate '+ex;
          var o9=add({type:'point',kind:'free',x:OX+S*evalNum(parts[0],vars),y:OY-S*evalNum(parts[1],vars)}); groups.push(1); name(o9,nm); });
        return; }
      if((m=/^\\tkzDefPoints\{([^}]*)\}/.exec(st))){ m[1].split(',').forEach(function(t){ var q=t.split('/'); var o=add({type:'point',kind:'free',x:OX+S*evalNum(q[0],vars),y:OY-S*evalNum(q[1],vars)}); groups.push(1); name(o,q[2]); }); return; }
      if((m=/^\\tkzDefPoint(?:\[[^\]]*\])?\(([^)]*(?:\([^)]*\)[^)]*)*)\)\{([^}]*)\}/.exec(st))){ var c=m[1], x, y;
        if(c.indexOf(':')>=0&&c.indexOf(',')<0){ var pq=c.split(':'); var a=evalNum(pq[0],vars), r=evalNum(pq[1],vars); x=r*Math.cos(a*Math.PI/180); y=r*Math.sin(a*Math.PI/180); }
        else { var parts=c.split(/,(?![^()]*\))/); x=evalNum(parts[0],vars); y=evalNum(parts[1],vars); }
        var o2=add({type:'point',kind:'free',x:OX+S*x,y:OY-S*y}); groups.push(1); name(o2,m[2]); return; }
      if((m=/^\\tkzDefShiftPoint\[([^\]]*)\]\(([^)]*)\)\{([^}]*)\}/.exec(st))){ var q2=m[2].split(':'); var o3=add({type:'point',kind:'shift',of:[pt(m[1])],ang:evalNum(q2[0],vars),d:S*evalNum(q2[1],vars)}); name(o3,m[3]); return; }
      if((m=/^\\tkzDefMidPoint\(([^)]*)\)\s*\\tkzGetPoint\{([^}]*)\}/.exec(st))){ var a2=args(m[1]); name(add({type:'point',kind:'mid',of:[pt(a2[0]),pt(a2[1])]}),m[2]); return; }
      var ctr=/^\\tkz(?:DefTriangleCenter\[(\w+)\]|CircumCenter|DefCircumCenter|InCenter|DefInCenter)\(([^)]*)\)\s*\\tkzGetPoint\{([^}]*)\}/.exec(st);
      if(ctr){ var kind={circum:'ccen',in:'inc',ortho:'orth',centroid:'cent',ex:'exc',euler:'nine',nine:'nine'}[ctr[1]||(/In/.test(st)?'in':'circum')]; if(!kind) throw 'centre '+ctr[1];
        var a3=args(ctr[2]).map(pt); if(kind==='exc') a3=[a3[1],a3[2],a3[0]];   /* [ex](C,A,B) is the excentre opposite A */
        name(add({type:'point',kind:kind,of:a3}),ctr[3]); return; }
      if((m=/^\\tkzDefCircle\[(\w+)\]\(([^)]*)\)\s*\\tkzGetPoints?\{([^}]*)\}/.exec(st))){ var a4=args(m[2]).map(pt);
        if(m[1]==='circum'){ name(add({type:'point',kind:'ccen',of:a4}),m[3]); add({type:'circle',kind:'circum',of:a4,invis:true}); return; }
        if(m[1]==='in'){ name(add({type:'point',kind:'inc',of:a4}),m[3]); add({type:'circle',kind:'inc',of:a4,invis:true}); return; }
        /* tkz-euclide's [ex](A,B,C) is the excircle opposite the middle point B; the sandbox's excentre is opposite its first point */
        if(m[1]==='ex'){ name(add({type:'point',kind:'exc',of:[a4[1],a4[2],a4[0]]}),m[3]); return; }
        throw 'circle '+m[1]; }
      if((m=/^\\tkzDefPointBy\[(\w+)\s*=\s*([^\]]*)\]\(([^)]*)\)\s*\\tkzGetPoint\{([^}]*)\}/.exec(st))){ var how=m[1], spec=m[2].trim(), src=pt(m[3].trim()), o4;
        if(how==='projection'){ var ab=/onto\s+(\S+)--(\S+)/.exec(spec); o4=add({type:'point',kind:'foot',of:[src,lineFor(ab[1],ab[2])]}); }
        else if(how==='reflection'){ var ab2=/over\s+(\S+)--(\S+)/.exec(spec); o4=add({type:'point',kind:'refl',of:[src,lineFor(ab2[1],ab2[2])]}); }
        else if(how==='symmetry'){ var cc=/center\s+(\S+)/.exec(spec); o4=add({type:'point',kind:'reflp',of:[src,pt(cc[1])]}); }
        else if(how==='homothety'){ var hh=/center\s+(\S+)\s+ratio\s+(.+)/.exec(spec); o4=add({type:'point',kind:'lin',of:[pt(hh[1]),src],k:evalNum(hh[2],vars)}); }
        else if(how==='rotation'){ var rr=/center\s+(\S+)\s+angle\s+(.+)/.exec(spec); o4=add({type:'point',kind:'rot',of:[pt(rr[1]),src],a:evalNum(rr[2],vars)}); }
        else if(how==='translation'){ var tt=/from\s+(\S+)\s+to\s+(\S+)/.exec(spec); o4=add({type:'point',kind:'parpt',of:[src,pt(tt[1]),pt(tt[2])]}); }
        else throw 'pointby '+how;
        name(o4,m[4]); return; }
      if((m=/^\\tkzDefPointWith\[(\w+)(?:\s*normed)?,\s*K=([^\]]*)\]\(([^)]*)\)\s*\\tkzGetPoint\{([^}]*)\}/.exec(st))){ var a5=args(m[3]).map(pt), K=evalNum(m[2],vars);
        if(m[1]==='linear') name(add({type:'point',kind:'lin',of:a5,k:K}),m[4]);
        else if(m[1]==='orthogonal') name(add({type:'point',kind:'orthk',of:a5,k:K}),m[4]);
        else throw 'with '+m[1]; return; }
      if((m=/^\\tkzDefLine\[(\w+)(?:=(?:through\s+)?([^\],]*))?[^\]]*\]\(([^)]*)\)\s*\\tkzGet(?:Point|Points)\{([^}]*)\}(?:\{([^}]*)\})?/.exec(st))){ var how2=m[1], thr=m[2]&&m[2].trim(), a6=args(m[3]), lo, aux;
        var n0=objs.length;
        if(how2==='orthogonal'||how2==='perpendicular'||how2==='parallel'){ var base=lineFor(a6[0],a6[1]); construct(how2==='parallel'?'par':'perp',[pt(thr),base]); lo=objs[objs.length-1]; aux=byId(lo.b); }
        else if(how2==='mediator'){ construct('pbis',[pt(a6[0]),pt(a6[1])]); lo=objs[objs.length-1]; aux=byId(lo.a); var aux2=byId(lo.b); aux2.label=norm(m[5]||'_'); P[aux2.label]=aux2.id; }
        else if(how2==='bisector'){ construct('abis',[pt(a6[0]),pt(a6[1]),pt(a6[2])]); lo=objs[objs.length-1]; aux=byId(lo.b); }
        else if(how2==='tangent'){ var at=/at\s*=\s*([^\]\s,]+)/.exec(st), fr=/from\s*=\s*([^\]\s,]+)/.exec(st);
          if(fr){ /* tangents from an outside point: the two points of contact */ var n2=objs.length; construct('tan',[pt(fr[1]),circleFor(a6[0],a6[1])]);
            var tp2=objs.slice(n2).filter(function(o){return o.kind==='tanpt';}); objs.slice(n2).forEach(function(o){ if(o.type==='line') o.invis=true; });
            name(tp2[0],m[4]); if(m[5]) name(tp2[1],m[5]); return; }
          if(!at) throw 'tangent'; var Pt=pt(at[1]); var rad=lineFor(a6[0],at[1]); construct('perp',[Pt,rad]); lo=objs[objs.length-1]; aux=byId(lo.b); thr=at[1]; }
        else throw 'defline '+how2;
        lo.invis=true; aux.label=norm(m[4]); P[aux.label]=aux.id; aux.hidden=true;
        var from=how2==='mediator'?null:(how2==='bisector'?a6[1]:thr);
        if(from) lineMap[norm(from)+'|'+norm(m[4])]=lo.id;
        if(how2==='mediator') lineMap[norm(m[4])+'|'+norm(m[5])]=lo.id;
        return; }
      if((m=/^\\tkzInterLL\(([^)]*)\)\(([^)]*)\)\s*\\tkzGetPoint\{([^}]*)\}/.exec(st))){ var l1=args(m[1]), l2=args(m[2]); name(add({type:'point',kind:'inter',of:[lineFor(l1[0],l1[1]),lineFor(l2[0],l2[1])]}),m[3]); return; }
      if((m=/^\\tkzInterLC(?:\[([^\]]*)\])?\(([^)]*)\)\(([^)]*)\)\s*\\tkz(GetPoints|GetFirstPoint|GetSecondPoint)\{([^}]*)\}(?:\{([^}]*)\})?/.exec(st))){
        if(m[1]&&/\bR\b/.test(m[1])) throw 'interLC R'; var l3=args(m[2]), c3=args(m[3]); var L=lineFor(l3[0],l3[1]), Cc=circleFor(c3[0],c3[1]);
        var cm2=m[1]&&/common=(\S+)/.exec(m[1]);
        var nm=m[4]==='GetPoints'?[m[5],m[6]]:(m[4]==='GetFirstPoint'?[m[5]]:[null,m[5]]);
        twoRoots('ilc',[L,Cc],nm,{common:cm2&&cm2[1],first:pt(l3[0])}); return; }
      if((m=/^\\tkzInterCC(?:\[([^\]]*)\])?\(([^)]*)\)\(([^)]*)\)\s*\\tkz(GetPoints|GetFirstPoint|GetSecondPoint)\{([^}]*)\}(?:\{([^}]*)\})?/.exec(st))){
        if(m[1]&&/\bR\b/.test(m[1])) throw 'interCC R'; var c4=args(m[2]), c5=args(m[3]);
        var nm2=m[4]==='GetPoints'?[m[5],m[6]]:(m[4]==='GetFirstPoint'?[m[5]]:[null,m[5]]);
        twoRoots('icc',[circleFor(c4[0],c4[1]),circleFor(c5[0],c5[1])],nm2,{c1:pt(c4[0]),c2:pt(c5[0])}); return; }
      if((m=/^\\tkzDefTangent\[from\s*=\s*(\S+?)\]\(([^)]*)\)\s*\\tkzGetPoints\{([^}]*)\}\{([^}]*)\}/.exec(st))){ var c6=args(m[2]); var n1=objs.length;
        construct('tan',[pt(m[1]),circleFor(c6[0],c6[1])]); var tp=objs.slice(n1).filter(function(o){return o.kind==='tanpt';}); objs.slice(n1).forEach(function(o){ if(o.type==='line') o.invis=true; });
        name(tp[0],m[3]); name(tp[1],m[4]); return; }
      if((m=/^\\tkzDefPointOnCircle\[([^\]]*)\]\s*\\tkzGetPoint\{([^}]*)\}/.exec(st))){ var op=m[1], th=/through\s*=\s*center\s+(\S+)\s+angle\s+([^\s\]]+)\s+point\s+(\S+)/.exec(op);
        if(th){ var circ=circleFor(th[1],th[3]); var o5=add({type:'point',kind:'onc',of:[circ],ang:-evalNum(th[2],vars)*Math.PI/180}); groups.push(1); name(o5,m[2]); return; }
        var cen=/center\s*=\s*(\S+?)[,\]]/.exec(op+']'), ang=/angle\s*=\s*([^,\]]+)/.exec(op), rad2=/radius\s*=\s*([^,\]]+)/.exec(op);
        if(cen&&ang&&rad2){ var C0=byId(pt(cen[1])); compute(); var a7=evalNum(ang[1],vars), r2=evalNum(rad2[1].replace(/cm/,''),vars);
          var o6=add({type:'point',kind:'free',x:C0.g.x+S*r2*Math.cos(a7*Math.PI/180),y:C0.g.y-S*r2*Math.sin(a7*Math.PI/180)}); groups.push(1); name(o6,m[2]); return; }
        throw 'onCircle'; }
      /* drawing: what the book draws is drawn here */
      if((m=/^\\tkzDraw(Segments?|Lines?|Polygon)(?:\[([^\]]*)\])?\(([^)]*)\)/.exec(st))){ var list=m[3].trim().split(/\s+/), sty=style(m[2]);
        if(m[1]==='Polygon'){ var vs=args(m[3]); for(var i=0;i<vs.length;i++) drawnSeg.push([vs[i],vs[(i+1)%vs.length],false,sty]); }
        else list.forEach(function(pr){ var q=args(pr); if(q.length>=2) drawnSeg.push([q[0],q[1],/Line/.test(m[1]),sty]); });
        return; }
      if((m=/^\\tkzDrawCircles?(?:\[([^\]]*)\])?\(([^)]*)\)/.exec(st))){ if(m[1]&&/\bR\b/.test(m[1])) return; var list2=m[2].trim().split(/\s+/);
        var sty2=style(m[1]);
        if(m[1]&&/circum/.test(m[1])){ drawnCirc.push({circum:args(m[2]),sty:sty2}); return; }
        list2.forEach(function(pr){ var q=args(pr); if(q.length===2) drawnCirc.push({c:q[0],t:q[1],sty:sty2}); }); return; }
      if((m=/^\\tkzLabelPoints?(?:\[[^\]]*\])?\(([^)]*)\)/.exec(st))){ args(m[1]).forEach(function(n){ labelled[norm(n)]=1; }); return; }
      if(/^\\tkz(Init|Clip|Get|Calc|Find|Mark|Label|Fill|Show|SetUp|Draw|Protractor|Text|Pic|Pic)/.test(st)) return;
      if(/^\\tkzDefCircle\[R\]|^\\tkzDefPointWith\[colinear/.test(st)){ unsupported.push(st.slice(0,40)); return; }
      if(/^\\tkz/.test(st)) unsupported.push(st.slice(0,50));
      }catch(err){ unsupported.push(String(err)+' @ '+st.slice(0,50)); }
    });
    var dress=function(o,sty){ if(sty) for(var k in sty) o[k]=sty[k]; return o; };
    drawnSeg.forEach(function(s){ try{
      /* a drawn line that the code built as a perpendicular, parallel or bisector keeps that construction */
      var mapped=lineMap[norm(s[0])+'|'+norm(s[1])]||lineMap[norm(s[1])+'|'+norm(s[0])];
      if(mapped){ var lo=byId(mapped); lo.invis=false; return; }   /* drawn full length, in the construction-line style */
      var A=pt(s[0]),B=pt(s[1]); var ex=objs.filter(function(o){return o.type==='line'&&o.kind==='two'&&sameSet([o.a,o.b],[A,B]);})[0];
      if(ex){ ex.invis=false; ex.style=s[2]?'line':'segment'; dress(ex,s[3]); } else dress(add({type:'line',kind:'two',style:s[2]?'line':'segment',a:A,b:B}),s[3]); }catch(e){} });
    drawnCirc.forEach(function(c){ try{ if(c.circum){ var ids=c.circum.map(pt); var ex=objs.filter(function(o){return o.type==='circle'&&o.kind==='circum'&&sameSet(o.of,ids);})[0]; if(ex){ ex.invis=false; dress(ex,c.sty); } else dress(add({type:'circle',kind:'circum',of:ids}),c.sty); return; }
      var id=circleFor(c.c,c.t); var co=byId(id); co.invis=false; dress(co,c.sty); }catch(e){} });
    /* points the book never labels are helpers */
    var anyLab=Object.keys(labelled).length>0;   /* figures labelled with TikZ nodes instead: keep every named point */
    objs.forEach(function(o){ if(o.type==='point'&&o.label&&anyLab&&!labelled[norm(o.label)]) o.hidden=true; if(o.type==='point'&&!o.label) o.hidden=true; });
    compute();
    groups=[objs.length]; picks=[];
    var bad=objs.filter(function(o){ return o.type==='point'&&!o.hidden&&(!o.g||!isFinite(o.g.x)); }).map(function(o){return o.label;});
    return {unsupported:unsupported, nonfinite:bad, points:Object.keys(P).length};
  }
  return {build:build,norm:norm};
})();
