"""python calibration/test_fit.py : runs fit.py end to end on synthetic answers in the export format.
Checks cleaning, the 1PL fallback, 2PL recovery, wrong-key flags, and that outputs carry no answers or letters."""
import json, os, re, subprocess, sys, tempfile, uuid
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import irt, fit

fails = 0
def check(cond, msg):
    global fails
    if not cond:
        fails += 1; print('FAIL', msg)

bank = json.load(open(os.path.join(ROOT, 'data', 'item_bank.json'), encoding='utf-8'))['items']
keys = {q['id']: q['ans'] for q in fit.js_value(os.path.join(ROOT, 'questions.js'), 'HU_QUESTIONS')}
rng = np.random.default_rng(int(os.environ.get("KV_SEED", "7")))
ids = [it['id'] for it in bank]
k = np.array([it['options'] or 5 for it in bank])
c = 1 / k
a_true = np.exp(rng.normal(np.log(1.327), 0.25, len(ids)))
b_true = np.array([it['prior']['b'] for it in bank]) + rng.normal(0, 0.384, len(ids))
WRONG_KEY, REVERSED = 'B1-5', 'E1-3'          # planted problems


def simulate(n_people, per_person, t0=1_790_000_000):
    rows, rid = [], 0
    for _ in range(n_people):
        anon, th = str(uuid.uuid4()), rng.normal(0.8, 0.9)
        for i in rng.choice(len(ids), per_person, replace=False):
            q = ids[i]
            ok = rng.random() < irt.prob(th, a_true[i], b_true[i], c[i])
            if q == REVERSED:
                ok = rng.random() < 1 - irt.prob(th, 1.5, 0.5, 0)
            letters = 'ABCDEFGH'[:k[i]]
            key = keys.get(q, 'A')
            if q == WRONG_KEY:                               # students' real right answer is not the stored key
                key = [x for x in letters if x != keys[q]][0]
            chosen = key if ok else rng.choice([x for x in letters if x != key])
            rid += 1; t0 += 7
            rows.append({'id': rid, 'anon_id': anon, 'question_id': q, 'chosen': str(chosen), 'correct': bool(ok),
                         'secs': int(rng.integers(20, 300)), 'answered_at': f'2026-10-{1 + rid % 20:02d}T10:00:{rid % 60:02d}Z',
                         'mode': 'smart'})
    return rows


def run(rows):
    d = tempfile.mkdtemp()
    src, out, rep = (os.path.join(d, n) for n in ('a.json', 'p.json', 'r.md'))
    json.dump(rows, open(src, 'w'))
    subprocess.run([sys.executable, os.path.join(HERE, 'fit.py'), '--attempts', src, '--out', out, '--report', rep], check=True, capture_output=True)
    return json.load(open(out)), open(rep, encoding='utf-8').read(), open(out).read()


# 1. cleaning: too fast and repeats dropped
rows = simulate(5, 10)
extra = [dict(rows[0], id=900001, secs=1), dict(rows[1], id=900002, answered_at='2026-10-30T10:00:00Z')]
cleaned, st = fit.clean(rows + extra, keys, {q: i for i, q in enumerate(ids)})
check(st['too_fast'] == 1 and st['repeat'] == 1 and st['used'] == len(rows), f'cleaning stats {st}')

# 2. thin data -> 1PL fallback, stated in the output
p, rep, raw = run(simulate(30, 10))
check(p['model'] == '1PL' and '1PL fallback' in p['note'], 'thin data did not fall back to 1PL: ' + p['model'])
check(len({v['a'] for v in p['items'].values()}) == 1, '1PL should have one common discrimination')

# 3. rich data -> 2PL, recovery, planted problems flagged
p, rep, raw = run(simulate(1500, 40))
check(p['model'] == '2PL', 'rich data did not use 2PL: ' + p['model'])
fitted = np.array([p['items'][q]['b'] for q in ids]); n = np.array([p['items'][q]['n'] for q in ids])
ok = (n >= 50) & np.array([q not in (WRONG_KEY, REVERSED) for q in ids])
prior_err = np.sqrt(np.mean((np.array([it['prior']['b'] for it in bank])[ok] - b_true[ok]) ** 2))
fit_err = np.sqrt(np.mean((fitted[ok] - b_true[ok]) ** 2))
check(fit_err < 0.6 * prior_err, f'difficulty recovery: prior RMSE {prior_err:.3f}, fit RMSE {fit_err:.3f}')
key_section = rep.split('## Check the answer key or wording')[1].split('##')[0]
check(WRONG_KEY in key_section, 'planted wrong key not flagged')
check(REVERSED in key_section, 'reversed locked question not flagged')
flagged = re.findall(r'^- (\S+) \(', key_section, re.M)
check(set(flagged) <= {WRONG_KEY, REVERSED}, 'false key alarms: ' + ', '.join(sorted(set(flagged) - {WRONG_KEY, REVERSED})))
print(f'2PL: {p["responses"]} answers, b RMSE prior {prior_err:.3f} -> fit {fit_err:.3f}; flagged: {len(re.findall(r"^- ", key_section, re.M))} item(s)')

# 4. outputs carry parameters only
check(not re.search(r'"(ans|answer|chosen|correct|q|opts|sol)"\s*:', raw), 'item_params.json has answer fields')
check(set(next(iter(p['items'].values()))) == {'a', 'b', 'a_sd', 'b_sd', 'n'}, 'unexpected item fields')
check(not re.search(r'(?<![A-Za-z0-9-])[A-H](?![A-Za-z0-9-])', rep.replace('**2PL**', '').replace('**1PL**', '')), 'report mentions an option letter')

print(f'{fails} FAILED' if fails else 'all calibration checks passed')
sys.exit(1 if fails else 0)
