"""Calibrate question difficulty from shared answers.

    python calibration/fit.py --attempts attempts.json            (from export.py)
    python calibration/fit.py --attempts none                      (no data yet: writes the priors)

Writes data/item_params.json (parameters only: never answers or question text) and calibration/report.md
(a data-quality report that names questions by id only and never prints option letters).

Cleaning: answers under 2 seconds are dropped; only each person's first answer to a question counts (later ones
come after seeing the solution); answers to free questions are re-marked against the current answer key in
questions.js, so a corrected key also corrects old data. Locked questions keep the browser's right/wrong flag.

Model: see calibration/irt.py. The full 2PL is used only when the data can support it (at least 3000 usable
answers and a median of at least 50 per answered question); otherwise discrimination is fixed at the
boundaries-model value for every question (a 1PL fit) and the output says so.
"""
import argparse, datetime, json, os, re, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import irt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN_SECS = 2
MIN_TOTAL_2PL, MIN_MEDIAN_2PL = 3000, 50
FEW = 20


def js_value(path, name):
    t = open(path, encoding='utf-8').read()
    m = re.search(r'(?:window\.|var\s+)' + name + r'\s*=\s*', t)
    return json.JSONDecoder().raw_decode(t[m.end():])[0]


def clean(rows, keys, known):
    """rows: dicts from hu_export_attempts. keys: {id: letter} for free questions. Returns kept rows and counts."""
    stats = {'received': len(rows), 'too_fast': 0, 'repeat': 0, 'unknown_item': 0, 'remarked': 0}
    rows = sorted(rows, key=lambda r: (r['answered_at'], r['id']))
    seen, out = set(), []
    for r in rows:
        if r['question_id'] not in known:
            stats['unknown_item'] += 1; continue
        if r['secs'] < MIN_SECS:
            stats['too_fast'] += 1; continue
        k = (r['anon_id'], r['question_id'])
        if k in seen:
            stats['repeat'] += 1; continue
        seen.add(k)
        ok = bool(r['correct'])
        if r['question_id'] in keys:
            new = r['chosen'] == keys[r['question_id']]
            stats['remarked'] += new != ok
            ok = new
        out.append({'q': r['question_id'], 'p': r['anon_id'], 'y': ok, 'c': r['chosen']})
    stats['used'] = len(out)
    return out, stats


def loo_theta(data, res, a, b, c):
    """Each response's ability estimate with that response removed (to judge items without circularity)."""
    p = irt.prob(irt.GRID[None, :], a[data.item][:, None], b[data.item][:, None], c[data.item][:, None])
    lik = np.where(data.y[:, None], p, 1 - p)
    w = res['post'][data.person] / lik
    w /= w.sum(axis=1, keepdims=True)
    return w @ irt.GRID


def diagnostics(data, res, a, b, c, ids, choices):
    """Per-item checks that need no answer key: correlation of right/wrong with leave-one-out ability, and whether
    the strongest third prefer one wrong option over the right one."""
    th = loo_theta(data, res, a, b, c)
    out = {}
    hi = th >= np.quantile(th, 2 / 3) if len(th) >= 3 else np.zeros(len(th), bool)
    for i, qid in enumerate(ids):
        m = data.item == i
        n = int(m.sum())
        if n == 0:
            out[qid] = {'n': 0}; continue
        y = data.y[m].astype(float)
        r = float(np.corrcoef(y, th[m])[0, 1]) if n >= 3 and y.std() > 0 and th[m].std() > 0 else None
        strong = m & hi
        prefer_wrong = False
        if strong.sum() >= 10:
            ch = choices[strong]; yy = data.y[strong]
            right = max(set(ch[yy]), key=list(ch[yy]).count) if yy.any() else None
            wrong = ch[~yy]
            if len(wrong):
                top_wrong = max(set(wrong), key=list(wrong).count)
                prefer_wrong = right is None or list(wrong).count(top_wrong) > list(ch).count(right)
        out[qid] = {'n': n, 'p': float(y.mean()), 'r': r, 'prefer_wrong': bool(prefer_wrong)}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--attempts', required=True, help='JSON file from export.py, or "none"')
    ap.add_argument('--out', default=os.path.join(ROOT, 'data', 'item_params.json'))
    ap.add_argument('--report', default=os.path.join(ROOT, 'calibration', 'report.md'))
    args = ap.parse_args()

    bank = json.load(open(os.path.join(ROOT, 'data', 'item_bank.json'), encoding='utf-8'))
    items = bank['items']
    ids = [it['id'] for it in items]
    index = {q: i for i, q in enumerate(ids)}
    keys = {q['id']: q['ans'] for q in js_value(os.path.join(ROOT, 'questions.js'), 'HU_QUESTIONS') if q['id'] in index}
    rows = [] if args.attempts == 'none' else json.load(open(args.attempts, encoding='utf-8'))
    kept, stats = clean(rows, keys, index)

    c = np.array([it['prior']['c'] if it['prior']['c'] is not None else 0.2 for it in items])
    b0 = np.array([it['prior']['b'] for it in items])
    b_sd0 = np.array([it['prior']['b_sd'] for it in items])
    la0 = np.log(np.array([it['prior']['a'] for it in items]))
    la_sd0 = np.array([it['prior']['a_log_sd'] for it in items])

    people = sorted({r['p'] for r in kept})
    pidx = {p: j for j, p in enumerate(people)}
    data = irt.Data([index[r['q']] for r in kept], [pidx[r['p']] for r in kept], [r['y'] for r in kept], len(items), len(people))
    answered = data.n_per_item[data.n_per_item > 0]
    median = float(np.median(answered)) if len(answered) else 0.0

    if not kept:
        model, why = 'prior', 'No usable answers yet: every value is the prior from the question ratings.'
        a, b, a_sd, b_sd = np.exp(la0), b0, np.exp(la0) * la_sd0, b_sd0
        mu, sigma, diag = 0.0, 1.0, {q: {'n': 0} for q in ids}
    else:
        full = stats['used'] >= MIN_TOTAL_2PL and median >= MIN_MEDIAN_2PL
        model = '2PL' if full else '1PL'
        why = ('Full 2PL: discrimination estimated per question.' if full else
               f'1PL fallback: only {stats["used"]} usable answers (median {median:.0f} per answered question); '
               f'2PL needs at least {MIN_TOTAL_2PL} and a median of {MIN_MEDIAN_2PL}. Discrimination is fixed at '
               f'{np.exp(la0[0]):.3f} for every question.')
        res = irt.fit(data, c, b0, b_sd0, la0, la_sd0, fix_a=not full)
        a, b, a_sd, b_sd, mu, sigma = res['a'], res['b'], res['a_sd'], res['b_sd'], res['mu'], res['sigma']
        if not full:
            a_sd = np.exp(la0) * la_sd0
        diag = diagnostics(data, res, a, b, c, ids, np.array([r['c'] for r in kept]))

    params = {
        'version': 1, 'fitted': datetime.date.today().isoformat(), 'model': model, 'note': why,
        'responses': stats['used'], 'people': len(people),
        'population': {'mean': round(mu, 3), 'sd': round(sigma, 3)},
        'items': {q: {'a': round(float(a[i]), 3), 'b': round(float(b[i]), 3), 'a_sd': round(float(a_sd[i]), 3),
                      'b_sd': round(float(b_sd[i]), 3), 'n': int(data.n_per_item[i])} for i, q in enumerate(ids)},
    }
    with open(args.out, 'w', encoding='utf-8', newline='\n') as f:
        head = json.dumps({k: v for k, v in params.items() if k != 'items'}, indent=2)[:-2]
        lines = ',\n'.join(f'    {json.dumps(q)}: {json.dumps(v, separators=(",", ":"))}' for q, v in params['items'].items())
        f.write(head + ',\n  "items": {\n' + lines + '\n  }\n}\n')

    write_report(args.report, params, stats, diag, items, b0, b_sd0)
    print(f'{model}: {stats["used"]} answers from {len(people)} people -> {os.path.relpath(args.out, ROOT)}')


def write_report(path, params, stats, diag, items, b0, b_sd0):
    T = lambda b: 4.5 + 1.951 * b                       # back to the rating scale
    L = [f'# Calibration report, {params["fitted"]}', '',
         'Questions are named by id only. No option letters or content appear in this report.', '',
         f'- Model: **{params["model"]}**. {params["note"]}',
         f'- Answers received {stats["received"]}, used {stats["used"]} (dropped: {stats["too_fast"]} under {MIN_SECS} s, '
         f'{stats["repeat"]} repeats, {stats["unknown_item"]} unknown ids). Re-marked against the current key: {stats["remarked"]}.',
         f'- People: {params["people"]}. Site users\' ability: mean {params["population"]["mean"]}, SD {params["population"]["sd"]} '
         f'(TMUA candidates: mean 0, SD 1).', '']
    flags = {'key': [], 'zero': [], 'easy': [], 'hard': [], 'rating': []}
    for i, it in enumerate(items):
        q, d, p = it['id'], diag.get(it['id'], {'n': 0}), params['items'][it['id']]
        if d['n'] >= 30 and ((d.get('r') is not None and d['r'] < 0) or d.get('prefer_wrong')):
            flags['key'].append(f'{q} (n {d["n"]}, correlation {d["r"]:.2f}{", strong students prefer a wrong option" if d.get("prefer_wrong") else ""})' if d.get('r') is not None else f'{q} (n {d["n"]})')
        elif d['n'] >= 30 and d.get('r') is not None and d['r'] < 0.1:
            flags['zero'].append(f'{q} (n {d["n"]}, correlation {d["r"]:.2f})')
        if d['n'] >= 30 and d['p'] > 0.95:
            flags['easy'].append(f'{q} ({100 * d["p"]:.0f}% right)')
        if d['n'] >= 30 and d['p'] < 0.05:
            flags['hard'].append(f'{q} ({100 * d["p"]:.0f}% right)')
        if p['n'] >= 30 and abs(p['b'] - b0[i]) > 2 * b_sd0[i]:
            flags['rating'].append(f'{q}: rated {T(b0[i]):.1f}, data says {T(p["b"]):.1f} (n {p["n"]})')
    few = sum(1 for it in items if params['items'][it['id']]['n'] < FEW)
    sec = [('Check the answer key or wording', 'key', 'Right/wrong runs against ability, or strong students prefer one wrong option.'),
           ('Near-zero discrimination', 'zero', 'Strong and weak students do about equally well: possibly ambiguous.'),
           ('Rating looks off', 'rating', 'Difficulty from data is more than two prior SDs from the rating. Consider data/prior_overrides.csv.'),
           ('Almost everyone right', 'easy', ''), ('Almost everyone wrong', 'hard', '')]
    for title, k, note in sec:
        L += [f'## {title} ({len(flags[k])})', ''] + ([note, ''] if note else []) + ([f'- {x}' for x in flags[k]] or ['None.']) + ['']
    L += [f'## Too few answers', '', f'{few} of {len(items)} questions have fewer than {FEW} usable answers; their values stay close to the prior.', '']
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(L))


if __name__ == '__main__':
    main()
