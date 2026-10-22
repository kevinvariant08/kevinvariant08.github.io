"""Estimate TMUA grade boundaries (2024+ scale, 1.0 to 9.0) for each Kevinvariant mock set.

Run from the repo root:  python tools/calibrate_boundaries.py
Writes boundaries.js, which tmua-boundaries.html and Drill read.

Model (documented on tmua-boundaries.html):
  * A question rated r on the site's 4.5-9.0 scale is solved, ignoring guesses, by half of the
    candidates who would score r on the real TMUA. So ratings and the official scale share units.
  * P(correct | candidate score S, question r) = c + (1 - c) / (1 + exp(-s (S - r))), where c = 1/options
    because the TMUA has no negative marking and blind guessing pays.
  * s is fitted so that an official-style paper reproduces published raw-mark anchors for the 2024+ scale
    (JZMaths: 4.5 ~ 18/40, 6.5 ~ 26/40, 7.5 ~ 31/40). The scale's meaning comes from UAT-UK's anchoring:
    the October median candidate scores 4.5 and the 90th percentile 7.0.
  * Boundaries are true-score equating: the raw mark a candidate of scaled score S is expected to get.
"""
import json, math, os, re
from statistics import NormalDist

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Locked papers are not in questions.js; their (rating, options) pairs, read from the private bucket on 22 Oct 2026.
LOCKED = {
    'I1': [(7.2,6),(7.2,6),(7.4,6),(7.4,6),(7.4,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.8,6),(7.8,6),(7.8,6),(7.8,6),(8.0,6),(8.2,6),(8.4,6)],
    'I2': [(7.2,6),(7.2,5),(7.4,6),(7.4,6),(7.4,6),(7.4,6),(7.4,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.6,6),(7.8,6),(7.8,6),(7.8,6),(7.8,6),(7.8,6),(8.0,6),(8.0,6),(8.4,6)],
    'J1': [(6.1,6),(6.2,6),(6.3,6),(6.4,6),(6.4,6),(6.6,7),(6.8,6),(6.8,6),(6.9,6),(7.0,7),(7.0,6),(7.0,6),(7.2,6),(7.2,6),(7.3,6),(7.4,6),(7.6,6),(7.8,6),(8.0,7),(8.2,6)],
    'J2': [(5.6,4),(6.0,8),(6.2,6),(6.2,4),(6.2,7),(6.4,8),(6.4,8),(6.4,6),(6.5,8),(6.6,4),(6.8,6),(6.8,6),(6.9,8),(7.1,6),(7.2,4),(7.2,8),(7.5,8),(7.6,6),(7.7,4),(7.9,8)],
}
ANCHORS = [(4.5, 18), (6.5, 26), (7.5, 31)]   # official-style paper, 2024+ scale (JZMaths estimates)
THRESHOLDS = [9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0]


def sig(x):
    return 1 / (1 + math.exp(-x))


def expected(S, items, s):
    return sum(1 / k + (1 - 1 / k) * sig(s * (S - r)) for r, k in items)


def fit_slope():
    best = None
    for sd in (0.8, 1.0, 1.2, 1.5):
        for m10 in range(30, 80):
            m = m10 / 10
            nd = NormalDist(m, sd)
            items = [(nd.inv_cdf((i + .5) / 40), 5) for i in range(40)]
            for s100 in range(30, 151):
                s = s100 / 100
                err = sum((expected(S, items, s) - x) ** 2 for S, x in ANCHORS)
                if best is None or err < best[0]:
                    best = (err, s, m, sd)
    return best


def load_questions():
    t = open(os.path.join(ROOT, 'questions.js'), encoding='utf-8').read()
    j = t.index('[', t.index('window.HU_QUESTIONS='))
    arr, _ = json.JSONDecoder().raw_decode(t[j:])
    papers = {}
    for q in arr:
        papers.setdefault(q['paper'], []).append((q['rating'], len(q['opts'])))
    papers.update(LOCKED)
    return papers


def table(items, s, n):
    """raw mark 0..n -> scaled score, by inverting the expected-score curve"""
    grid = [1.0 + i / 100 for i in range(801)]
    curve = [expected(S, items, s) for S in grid]
    out = []
    for x in range(n + 1):
        if x <= curve[0]:
            out.append(1.0)
        elif x >= curve[-1]:
            out.append(9.0)
        else:
            i = next(i for i, e in enumerate(curve) if e >= x)
            S = grid[i - 1] + (x - curve[i - 1]) / (curve[i] - curve[i - 1]) * (grid[i] - grid[i - 1])
            out.append(round(min(9.0, max(1.0, S)), 1))
    return out


def main():
    err, s, m, sd = fit_slope()
    papers = load_questions()
    sets = sorted({p[0] for p in papers}, reverse=True)
    data = {'model': {'slope': s, 'officialMean': m, 'officialSd': sd, 'fitError': round(err, 2),
                      'anchors': ANCHORS, 'source': 'Fitted ' + __import__('datetime').date.today().isoformat()},
            'sets': {}}
    nd = NormalDist(m, sd)
    official = [(nd.inv_cdf((i + .5) / 40), 5) for i in range(40)]
    # expected raw mark (out of 40) on an official-style paper for scores 1.0, 1.1, ... 9.0
    data['official'] = [round(expected(1 + i / 10, official, s), 1) for i in range(81)]
    for st in sets:
        items = papers[st + '1'] + papers[st + '2']
        comb = table(items, s, 40)
        bounds = {}
        for T in THRESHOLDS:
            raw = next((x for x, v in enumerate(comb) if v >= T), None)
            bounds['%.1f' % T] = raw
        data['sets'][st] = {
            'combined': comb, 'boundaries': bounds,
            'papers': {p: table(papers[p], s, 20) for p in (st + '1', st + '2')},
            'meanRating': round(sum(r for r, _ in items) / 40, 2),
            'median': round(expected(4.5, items, s), 1), 'p90': round(expected(7.0, items, s), 1),
        }
    js = ('/* Generated by tools/calibrate_boundaries.py. Estimated TMUA 2024+ scaled scores for each mock set.\n'
          '   combined[raw out of 40] and papers[code][raw out of 20] give the estimated score on the 1.0-9.0 scale. */\n'
          'window.KV_BOUNDARIES=' + json.dumps(data, separators=(',', ':')) + ';\n')
    open(os.path.join(ROOT, 'boundaries.js'), 'w', encoding='utf-8', newline='\n').write(js)
    print('slope %.2f  official mean %.1f  sd %.1f  fit error %.2f' % (s, m, sd, err))
    print('set  mean   ' + '  '.join('%4s' % ('%.1f' % T) for T in THRESHOLDS) + '   median  p90')
    for st in sets:
        d = data['sets'][st]
        print('%s   %.2f  ' % (st, d['meanRating']) + '  '.join('%4s' % d['boundaries']['%.1f' % T] for T in THRESHOLDS)
              + '    %4.1f  %4.1f' % (d['median'], d['p90']))


if __name__ == '__main__':
    main()
