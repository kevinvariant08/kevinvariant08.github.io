"""Fit the construction weights from collect.js output and check them on held-out diagrams.
Usage: python3 fit.py train.json ../../construction-weights.js

Two parts are fitted.
1. Each technique and context gets a hit rate: how often a candidate of that kind is a point the book adds.
   Rates are shrunk (context towards technique, technique towards overall), so rare keys stay near average.
2. Goal weights: how much likelier a candidate is when it is built on the points the problem asks about
   (one, two or three of its parents are goal points, all of them are, it lies on a line through two goal
   points, it is the midpoint of two). These are fitted by logistic regression on top of part 1.
The held-out figures are never used to fit the weights they are scored with."""
import json, sys, math, collections
import numpy as np

T = json.load(open(sys.argv[1]))
A, B, BETA, MINC, LAM, FOLDS = 16, 30, 2.0, 3, 2.0, 10
GF = ['n1', 'n2', 'n3', 'a', 'l', 'm']

tags = sorted({r['tag'] for f in T for r in f['rows']}); keys = sorted({r['key'] for f in T for r in f['rows']})
ti = {t: i for i, t in enumerate(tags)}; ki = {k: i for i, k in enumerate(keys)}

def pack(f):
    rows = [r for r in f['rows'] if r['finite'] and not r['coin']]
    gn = np.array([r.get('gn', 0) for r in rows]); gp = [r.get('gp', '') for r in rows]
    X = np.stack([gn == 1, gn == 2, gn >= 3, np.array([r.get('ga', 0) for r in rows]) == 1,
                  np.array([p == 'l' for p in gp]), np.array([p == 'm' for p in gp])], 1).astype(float) if rows else np.zeros((0, 6))
    return dict(i=f['i'], ng=f.get('ng', 0), tag=np.array([ti[r['tag']] for r in rows], int), key=np.array([ki[r['key']] for r in rows], int),
                pre=np.array([r['pre'] for r in rows], float), hit=np.array([1.0 if r['hit'] else 0.0 for r in rows]), X=X)
P = [pack(f) for f in T]

def counts(figs):
    th = np.zeros(len(tags)); tc = np.zeros(len(tags)); sh = np.zeros(len(keys)); sc = np.zeros(len(keys))
    for f in figs:
        np.add.at(tc, f['tag'], 1); np.add.at(th, f['tag'], f['hit']); np.add.at(sc, f['key'], 1); np.add.at(sh, f['key'], f['hit'])
    return th, tc, sh, sc
def base_score(f, C):
    th, tc, sh, sc = C; g = (th.sum() + 1) / (tc.sum() + 2)
    pt = (th[f['tag']] + B * g) / (tc[f['tag']] + B); ok = sc[f['key']] >= MINC
    ps = (np.where(ok, sh[f['key']], 0) + A * pt) / (np.where(ok, sc[f['key']], 0) + A)
    return np.log(ps / (1 - ps)) + BETA * np.log1p(f['pre'])
def fit_goal(figs, C):
    """logistic regression on the goal features, with the technique score as a fixed offset"""
    use = [f for f in figs if f['ng'] and len(f['hit'])]
    X = np.concatenate([f['X'] for f in use]); y = np.concatenate([f['hit'] for f in use]); off = np.concatenate([base_score(f, C) for f in use])
    w = np.zeros(X.shape[1]); b = 0.0
    for _ in range(40):
        p = 1 / (1 + np.exp(-(off + X @ w + b))); S = p * (1 - p)
        g = np.concatenate([X.T @ (p - y) + LAM * w, [(p - y).sum()]])
        H = np.zeros((len(w) + 1, len(w) + 1)); H[:-1, :-1] = (X * S[:, None]).T @ X + LAM * np.eye(len(w)); H[:-1, -1] = H[-1, :-1] = X.T @ S; H[-1, -1] = S.sum()
        step = np.linalg.solve(H, g); w -= step[:-1]; b -= step[-1]
        if np.abs(step).max() < 1e-7: break
    return w
def first_hit(score, hit):
    order = np.argsort(-score, kind='stable'); pos = np.nonzero(hit[order])[0]
    return int(pos[0]) + 1 if len(pos) else None
def report(name, rk):
    rk = [x for x in rk if x is not None or True]; n = len(rk); h = lambda k: sum(1 for x in rk if x and x <= k)
    print(f'{name:44s} diagrams {n}  first {h(1)} ({100*h(1)/n:.0f}%)  top5 {h(5)} ({100*h(5)/n:.0f}%)  top20 {h(20)} ({100*h(20)/n:.0f}%)  MRR {sum(1/x for x in rk if x)/n:.3f}')

figs = [f for f in P if f['hit'].any()]
report('relations only (before)', [first_hit(f['pre'], f['hit']) for f in figs])
# technique weights alone, each diagram scored by weights fitted without it
Call = counts(P)
def without(C, fs):
    D = counts(fs); return tuple(c - d for c, d in zip(C, D))
report('techniques, held out', [first_hit(base_score(f, without(Call, [f])), f['hit']) for f in figs])
# technique + goal weights, ten folds: everything fitted on the other nine
rng = np.random.default_rng(0); perm = rng.permutation(len(P)); fold = {P[j]['i']: k % FOLDS for k, j in enumerate(perm)}
rk_base, rk_goal, src = [], [], []
for k in range(FOLDS):
    test = [f for f in P if fold[f['i']] == k]; train = [f for f in P if fold[f['i']] != k]
    C = counts(train); w = fit_goal(train, C)
    for f in test:
        if not f['hit'].any(): continue
        b = base_score(f, C); rk_base.append(first_hit(b, f['hit'])); rk_goal.append(first_hit(b + (f['X'] @ w if f['ng'] else 0), f['hit'])); src.append(f)
report('techniques, ten-fold', rk_base)
report('techniques + goal, ten-fold', rk_goal)
with_goal = [j for j, f in enumerate(src) if f['ng']]
report('  diagrams with a stated goal: techniques', [rk_base[j] for j in with_goal])
report('  diagrams with a stated goal: + goal', [rk_goal[j] for j in with_goal])

th, tc, sh, sc = Call; g = (th.sum() + 1) / (tc.sum() + 2); w = fit_goal(P, Call)
W = {'g': float(g), 't': {t: [int(th[i]), int(tc[i])] for t, i in ti.items()},
     's': {k: [int(sh[i]), int(sc[i])] for k, i in ki.items() if sc[i] >= MINC},
     'gf': {n: round(float(v), 3) for n, v in zip(GF, w)}}
print('goal weights', W['gf'])
open(sys.argv[2], 'w').write('/* Construction weights for the sandbox, fitted by tools/train-constructions/fit.py on ' + str(len(T)) + ' olympiad diagrams (Beyond the Incenter, textbook, Sharygin and contest problems).\n   [hits, candidates] per technique (t) and per technique in context (s); gf holds the goal weights. */\nwindow.AUX_LEARNED=' + json.dumps(W, separators=(',', ':')) + ';\n')
print('wrote', sys.argv[2], len(W['s']), 'context keys')
