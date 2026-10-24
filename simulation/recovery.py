"""Simulation study, part (a): does calibration recover question parameters as answers accumulate?

    python simulation/recovery.py            (about 10 minutes; writes simulation/results/recovery.json)

Truth is drawn from the priors themselves: each question's true difficulty is its rating-based prior plus
Normal(0, 0.384) noise (ratings are imperfect by exactly the amount the prior assumes), and true discrimination is
log-normal around 1.327. Simulated students have ability Normal(0.8, 0.9), i.e. stronger than the median TMUA
candidate, and each answers 20 questions drawn at random from the whole bank of 440. The calibration code is the
production code (calibration/irt.py), run as 2PL and as 1PL. Also writes simulation/results/truth.json, the
"true" parameters used by part (b).
"""
import json, os, sys, time
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, 'calibration'))
import irt

SEED, PER_PERSON, REPS = 2026, 20, 5
SIZES = [25, 50, 100, 200, 400, 800, 1600, 3200]
POP_MU, POP_SD = 0.8, 0.9

bank = json.load(open(os.path.join(ROOT, 'data', 'item_bank.json'), encoding='utf-8'))['items']
I = len(bank)
ids = [it['id'] for it in bank]
b0 = np.array([it['prior']['b'] for it in bank]); b_sd = np.array([it['prior']['b_sd'] for it in bank])
la0 = np.log(np.array([it['prior']['a'] for it in bank])); la_sd = np.array([it['prior']['a_log_sd'] for it in bank])
c = 1 / np.array([it['options'] or 5 for it in bank])

rng = np.random.default_rng(SEED)
b_true = b0 + rng.normal(0, b_sd)
a_true = np.exp(rng.normal(la0, la_sd))
os.makedirs(os.path.join(HERE, 'results'), exist_ok=True)
json.dump({'ids': ids, 'a': a_true.round(4).tolist(), 'b': b_true.round(4).tolist(), 'c': c.round(4).tolist(),
           'prior_a': np.exp(la0).round(4).tolist(), 'prior_b': b0.round(4).tolist(),
           'free': [not it['locked'] for it in bank], 'population': {'mean': POP_MU, 'sd': POP_SD}},
          open(os.path.join(HERE, 'results', 'truth.json'), 'w'))

rmse = lambda e, t: float(np.sqrt(np.mean((e - t) ** 2)))
rows = []
t_start = time.time()
for n_people in SIZES:
    for rep in range(REPS):
        r = np.random.default_rng([SEED, n_people, rep])
        theta = r.normal(POP_MU, POP_SD, n_people)
        items = np.concatenate([r.choice(I, PER_PERSON, replace=False) for _ in range(n_people)])
        people = np.repeat(np.arange(n_people), PER_PERSON)
        y = r.random(len(items)) < irt.prob(theta[people], a_true[items], b_true[items], c[items])
        data = irt.Data(items, people, y, I, n_people)
        row = {'people': n_people, 'rep': rep, 'responses': int(len(y)), 'per_item': len(y) / I}
        for name, fix in (('2PL', False), ('1PL', True)):
            f = irt.fit(data, c, b0, b_sd, la0, la_sd, fix_a=fix)
            row[name] = {'b_rmse': rmse(f['b'], b_true), 'a_rmse': rmse(f['a'], a_true),
                         'b_cover': float(np.mean(np.abs(f['b'] - b_true) < 1.96 * f['b_sd'])),
                         'mu': f['mu'], 'sigma': f['sigma']}
        row['prior'] = {'b_rmse': rmse(b0, b_true), 'a_rmse': rmse(np.exp(la0), a_true)}
        rows.append(row)
        print(f'{n_people:5d} people rep {rep}: {row["per_item"]:6.1f} answers/question | b RMSE prior {row["prior"]["b_rmse"]:.3f} '
              f'1PL {row["1PL"]["b_rmse"]:.3f} 2PL {row["2PL"]["b_rmse"]:.3f} | a RMSE prior {row["prior"]["a_rmse"]:.3f} '
              f'2PL {row["2PL"]["a_rmse"]:.3f} | {time.time() - t_start:.0f}s', flush=True)

json.dump({'seed': SEED, 'per_person': PER_PERSON, 'population': {'mean': POP_MU, 'sd': POP_SD}, 'rows': rows},
          open(os.path.join(HERE, 'results', 'recovery.json'), 'w'), indent=1)
print('done')
