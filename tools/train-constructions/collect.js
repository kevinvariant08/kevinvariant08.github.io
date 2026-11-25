/* Collect training data for the sandbox's construction ranking.
   For each book diagram with its problem statement: load it as the problem figure, list every candidate
   construction with its technique key (candKey in sandbox.html), how it sits relative to the points the
   problem asks about (goalFeat), and mark the candidates that land on a point the book's solution adds.
   Usage: node collect.js diagrams.json out.json [http://localhost:8776/sandbox.html]
   diagrams.json is a list of {i, code, prob}: tkz-euclide code and the problem it draws. Not in the repo. */
const {chromium}=require('playwright'); const fs=require('fs');
const [,,inp,outp,url='http://localhost:8776/sandbox.html']=process.argv;
const D=JSON.parse(fs.readFileSync(inp,'utf8')).filter(d=>d.prob);
/* what the problem asks for: the text from its last "prove", "show" or "find" on, without a trailing source note */
const goalText=p=>{ const re=/\b(prove|show|find|determine|deduce)\b/gi; let m,last=-1; while((m=re.exec(p))) last=m.index;
  return last<0?'':p.slice(last).replace(/\\hfill[\s\S]*$/,'').replace(/\\textit\{[^}]*\}/g,''); };
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1400,height:900}});
 await pg.goto(url); await pg.waitForTimeout(400); const out=[];
 for(const d of D){
  await pg.evaluate(([c,p])=>{ document.getElementById('texin').value=c; document.getElementById('texprob').value=p; document.getElementById('texload').click(); },[d.code,d.prob]);
  const r=await pg.evaluate((gt)=>{
    if(!PROB.on) return null; compute();
    const glabs=gt?statementTokens(wrapLabels(gt)).labels:{};
    const G=objs.filter(o=>o.type==='point'&&!o.hidden&&o.label&&glabs[normLab(o.label)]&&o.g&&isFinite(o.g.x));
    const Pts=objs.filter(o=>o.type==='point'&&!o.hidden&&isFinite(o.g.x)), xs=Pts.map(p=>p.g.x), ys=Pts.map(p=>p.g.y);
    const Dm=Math.max(60,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
    const book=PROB.stash.filter(o=>o.type==='point'&&o.label&&!o.hidden&&o.g&&isFinite(o.g.x)).map(o=>({label:o.label,g:{x:o.g.x,y:o.g.y}}));
    const base=relations(true), rows=[];
    auxCandidates().filter(c=>c.type==='point').forEach(c=>{ const k=candKey(c), undo=auxPush(c,'ZQ'); compute();
      const np=objs[objs.length-1], g=np&&np.g&&isFinite(np.g.x)?{x:np.g.x,y:np.g.y}:null; let pre=0, coin=false;
      if(g){ const now=relations(true); Object.keys(now).forEach(key=>{ if(base[key]) return; const t=key.split(':')[0]; if(t==='ang') return; if(t==='same') coin=true; pre+=(AUX_WEIGHT[t]||1); }); }
      undo(); let hit=null; if(g) for(const bp of book) if(Math.hypot(bp.g.x-g.x,bp.g.y-g.y)<Dm*1e-6) hit=bp.label;
      const gf=goalFeat(c,G,g,Dm);
      rows.push({tag:k.tag,key:k.key,hit,prior:c.prior||0,pre,coin,finite:!!g,gn:gf.n,ga:gf.a,gp:gf.p}); });
    compute(); return {book:book.length,ng:G.length,rows}; },goalText(d.prob));
  if(r) out.push({i:d.i,...r}); }
 fs.writeFileSync(outp,JSON.stringify(out)); console.log('diagrams',out.length,'with book constructions',out.filter(x=>x.book).length);
 await b.close(); })();
