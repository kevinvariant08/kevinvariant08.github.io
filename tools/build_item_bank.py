"""Build data/item_bank.json: metadata and IRT priors for every TMUA question (no answers, no question text).

Run from the repo root:  python tools/build_item_bank.py
Reads  questions.js (free papers), data/locked_items.csv, locks.js (which papers are locked),
       data/topic_tags.csv (free questions), data/prior_overrides.csv (optional rating overrides),
       private/locked_topic_tags.csv (gitignored; topic tags of locked questions, if present).
Writes data/item_bank.json (public) and private/locked_meta/<paper>.json (gitignored; topic tags of
       locked questions, to be uploaded next to each paper's questions.json in the private bucket).

Model (same as tools/calibrate_boundaries.py on the features branch):
  P(correct | TMUA score S) = c + (1 - c) / (1 + exp(-s (S - r))),  r = the question's rating, c = 1/options.
  With ability theta defined by S = 4.5 + 1.951 theta (theta = 0 is the median TMUA candidate, theta = 1 one
  candidate SD; UAT-UK anchoring puts the median at 4.5 and the 90th percentile at 7.0), this is the 2PL model
  with a fixed guessing floor:  P = c + (1 - c) / (1 + exp(-a (theta - b))),  a = s * 1.951,  b = (r - 4.5) / 1.951.
"""
import csv, datetime, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

SLOPE = 0.68                  # s, per TMUA-scale point (fitted 22 Oct 2026 to published raw-mark anchors)
TMUA_MEAN, TMUA_SD = 4.5, 1.951   # (7.0 - 4.5) / 1.2816
RATING_SD = 0.75              # how far a rating may sit from the truth, in TMUA points (prior SD of b = 0.384)
A_LOG_SD = 0.3                # prior SD of log a
TOPICS = [
    ('algebra', 'Algebra'), ('functions-graphs', 'Functions and graphs'), ('sequences-series', 'Sequences and series'),
    ('differentiation', 'Differentiation'), ('integration', 'Integration'), ('trigonometry', 'Trigonometry'),
    ('exponentials-logs', 'Exponentials and logs'), ('geometry', 'Geometry'),
    ('probability-counting', 'Probability and counting'), ('number', 'Number'), ('logic-proof', 'Logic and proof'),
]
KEYS = {k for k, _ in TOPICS}


def js_value(path, name):
    """The JSON value assigned to window.<name> (or var <name>) in a .js file."""
    t = open(path, encoding='utf-8').read()
    m = re.search(r'(?:window\.|var\s+)' + name + r'\s*=\s*', t)
    return json.JSONDecoder().raw_decode(t[m.end():])[0]


def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8', newline='') as f:
        return list(csv.DictReader(line for line in f if not line.startswith('#')))


def topics_of(row, qid):
    out = [t for t in (row.get('primary', '').strip(), row.get('secondary', '').strip()) if t]
    bad = [t for t in out if t not in KEYS]
    if not out or bad or len(set(out)) != len(out):
        raise SystemExit(f'{qid}: bad topic tags {out}')
    return out


def prior(rating, options):
    return {
        'b': round((rating - TMUA_MEAN) / TMUA_SD, 3), 'b_sd': round(RATING_SD / TMUA_SD, 3),
        'a': round(SLOPE * TMUA_SD, 3), 'a_log_sd': A_LOG_SD,
        'c': round(1 / options, 4) if options else None,
    }


def order(qid):
    p, n = qid.split('-')
    return (p[0], int(p[1]), int(n))


def main():
    locked_papers = set(js_value(P('locks.js'), 'META'))
    free = [q for q in js_value(P('questions.js'), 'HU_QUESTIONS') if q['paper'] not in locked_papers]
    locked = read_csv(P('data', 'locked_items.csv'))
    tags = {r['id']: r for r in read_csv(P('data', 'topic_tags.csv'))}
    ltags = {r['id']: r for r in read_csv(P('private', 'locked_topic_tags.csv'))}
    overrides = {r['id']: float(r['override']) for r in read_csv(P('data', 'prior_overrides.csv')) if r.get('override', '').strip()}

    items = []
    # Only whitelisted fields are copied from questions.js, so answers and text can never reach the bank.
    for q in free:
        if q['id'] not in tags:
            raise SystemExit(f'{q["id"]}: no topic tags in data/topic_tags.csv')
        items.append({'id': q['id'], 'set': q['paper'][0], 'paper': int(q['paper'][1]), 'locked': False,
                      'options': len(q['opts']), 'rating': q['rating'], 'topics': topics_of(tags[q['id']], q['id'])})
    for r in locked:
        paper = r['id'].split('-')[0]
        if paper not in locked_papers:
            raise SystemExit(f'{r["id"]} is listed in locked_items.csv but {paper} is not locked in locks.js')
        items.append({'id': r['id'], 'set': paper[0], 'paper': int(paper[1]), 'locked': True,
                      'options': int(r['options']) if r['options'].strip() else None, 'rating': float(r['rating'])})
    for it in items:
        it['rating_used'] = overrides.get(it['id'], it['rating'])
        it['prior'] = prior(it['rating_used'], it['options'])
    items.sort(key=lambda it: order(it['id']))

    ids = [it['id'] for it in items]
    if len(ids) != len(set(ids)):
        raise SystemExit('duplicate ids')
    unknown = set(overrides) - set(ids)
    if unknown:
        raise SystemExit(f'overrides for unknown ids: {sorted(unknown)}')

    bank = {
        'version': 1,
        'generated': datetime.date.today().isoformat(),
        'about': 'Metadata and IRT priors for Kevinvariant TMUA questions. No question text or answers. '
                 'Topics are listed for free questions only.',
        'model': {
            'form': 'P(correct) = c + (1 - c) / (1 + exp(-a (theta - b)))',
            'theta_to_tmua': {'mean': TMUA_MEAN, 'sd': TMUA_SD, 'note': 'TMUA estimate = 4.5 + 1.951 theta (rough estimate, not an official prediction)'},
            'slope_per_tmua_point': SLOPE, 'rating_sd': RATING_SD,
        },
        'topics': [{'key': k, 'label': l} for k, l in TOPICS],
        'items': items,
    }
    lines = ',\n'.join('    ' + json.dumps(it, separators=(',', ':')) for it in items)
    head = json.dumps({k: v for k, v in bank.items() if k != 'items'}, indent=2)[:-2]
    with open(P('data', 'item_bank.json'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(head + ',\n  "items": [\n' + lines + '\n  ]\n}\n')

    # Private: topic tags of locked questions, one file per paper, for the locked bucket.
    if ltags:
        os.makedirs(P('private', 'locked_meta'), exist_ok=True)
        by_paper = {}
        for r in locked:
            if r['id'] in ltags:
                by_paper.setdefault(r['id'].split('-')[0], {})[r['id']] = topics_of(ltags[r['id']], r['id'])
        for paper, d in by_paper.items():
            with open(P('private', 'locked_meta', paper + '.json'), 'w', encoding='utf-8', newline='\n') as f:
                json.dump({'topics': d}, f, separators=(',', ':'))

    n_free = sum(not it['locked'] for it in items)
    print(f'{len(items)} items: {n_free} free, {len(items) - n_free} locked; {len(overrides)} rating overrides; '
          f'locked topic tags for {len(ltags)} questions (private)')


if __name__ == '__main__':
    main()
