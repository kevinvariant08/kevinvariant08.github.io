"""Fit the construction weights from collect.js output and check them on held-out diagrams.
Usage: python3 fit.py train.json ../../construction-weights.js
Each technique and context gets a hit rate: how often a candidate of that kind is a point the book adds.
Rates are shrunk (context towards technique, technique towards overall), so rare keys stay near average."""
import json,sys,math,collections
T=json.load(open(sys.argv[1])); A,B,BETA,MINC=16,30,2.0,3
def counts(figs):
    tc=collections.Counter(); th=collections.Counter(); sc=collections.Counter(); sh=collections.Counter()
    for f in figs:
        for r in f['rows']:
            if r['coin'] or not r['finite']: continue
            h=1 if r['hit'] else 0; tc[r['tag']]+=1; th[r['tag']]+=h; sc[r['key']]+=1; sh[r['key']]+=h
    return tc,th,sc,sh
def scorer(figs,minc=1):
    tc,th,sc,sh=counts(figs); g=(sum(th.values())+1)/(sum(tc.values())+2)
    def w(r):
        pt=(th[r['tag']]+B*g)/(tc[r['tag']]+B); s=(sh[r['key']],sc[r['key']]) if sc[r['key']]>=minc else (0,0)
        ps=(s[0]+A*pt)/(s[1]+A); return math.log(ps/(1-ps))
    return w
def first_hit(f,score):
    rows=sorted([r for r in f['rows'] if r['finite'] and not r['coin']],key=score,reverse=True)
    return next((i+1 for i,r in enumerate(rows) if r['hit']),None)
figs=[f for f in T if any(r['hit'] for r in f['rows'])]
def report(name,fn):
    rk=[fn(f) for f in figs]; h=lambda k: sum(1 for x in rk if x and x<=k)
    print(f'{name:40s} diagrams {len(rk)}  first {h(1)}  top5 {h(5)}  top20 {h(20)}  top60 {h(60)}  MRR {sum(1/x for x in rk if x)/len(rk):.3f}')
report('relations only (before)',lambda f: first_hit(f,lambda r: r['pre']))
report('learned, held out',lambda f: first_hit(f,lambda r,w=scorer([g for g in T if g['i']!=f['i']],MINC): w(r)+BETA*math.log(1+r['pre'])))
tc,th,sc,sh=counts(T); g=(sum(th.values())+1)/(sum(tc.values())+2)
W={'g':g,'t':{k:[th[k],tc[k]] for k in tc},'s':{k:[sh[k],sc[k]] for k in sc if sc[k]>=MINC}}
open(sys.argv[2],'w').write('/* Construction weights for the sandbox, fitted by tools/train-constructions/fit.py on '+str(len(T))+' Beyond the Incenter diagrams.\n   [hits, candidates] per technique (t) and per technique in context (s). */\nwindow.AUX_LEARNED='+json.dumps(W,separators=(',',':'))+';\n')
print('wrote',sys.argv[2],len(W['s']),'context keys')
