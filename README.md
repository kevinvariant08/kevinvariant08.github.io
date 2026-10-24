# kevinvariant08.github.io
Academic portfolio and official host of the Olympiad geometry guide "Beyond the Incenter".

📚 **New Book:** [Beyond the Incenter: A Modern Monograph on Olympiad Geometry](book.md)

## Smart Practice (adaptive TMUA practice)

[Smart Practice](smart.html) chooses each TMUA question to suit the student's current level, estimates their ability as they go, and ends with a level, topic strengths and a suggested next topic. It uses item response theory, the standard method behind adaptive tests such as the GMAT. Nothing about the method is new; the work is in doing it carefully with a small bank, no data at launch and a static site.

**How it works**
- Model: two-parameter logistic with a fixed guessing floor of 1/(number of options). Ability is on a scale where 0 is the median TMUA candidate, so a TMUA score is roughly 4.5 + 1.951 x ability. That figure is always shown as a rough estimate, never an official prediction.
- Priors: each question's difficulty starts from its rating on the site ([`data/item_bank.json`](data/item_bank.json), built by `tools/build_item_bank.py`; ratings can be overridden in `data/prior_overrides.csv`).
- In the browser ([`smart.js`](smart.js)): the ability estimate is the posterior mean on a grid; the next question is the most informative one, with topic rotation, a random pick among the top five and an easier question now and then.
- Locked papers are never shipped to visitors who have not unlocked them. Smart Practice loads them only through the existing server-checked unlock (`locks.js`) and filters by the lock rule again.

**Privacy**
- Nothing leaves the browser unless the visitor chooses "Share anonymously". Only answers made after that choice are sent.
- Each shared answer is a question id, the option chosen, right or wrong, seconds taken, when, and the practice mode, with a random id made by the browser. No names, emails, account ids or free text. Requests carry only the site's public key, never a sign-in token, and the database functions never look at who is signed in ([`attempts.sql`](attempts.sql)).
- The browser can only add answers or delete its own; it can never read the table. Details for visitors: [privacy note](privacy.html).

**Calibration**
- Weekly, a GitHub Actions workflow (`.github/workflows/calibrate.yml`) downloads shared answers with a narrow calibration key, refits question difficulty by Bayes-modal EM (`calibration/fit.py`, `calibration/irt.py`) and opens a pull request with `data/item_params.json` (parameters only) and `calibration/report.md`, which flags questions whose answers run against ability (often a wrong answer key) by id only.
- Thin data fall back to a one-parameter fit, and the output says so.

**Evidence**
- A simulation study ([note](simulation/note/smart_practice_note.pdf), code in `simulation/`) shows calibration improving steadily on the ratings and adaptive selection reaching a standard error of 0.4 in 11 questions against 30 for random practice once calibrated.

**Tests**
```
node tools/test_item_bank.js
node tools/test_telemetry.js
node tools/test_smart.js
cd tools && npm install && cd .. && node tools/test_attempts_sql.mjs
python calibration/test_fit.py
```
Manual checks before every deploy: [`SMART_PRACTICE_CHECKS.md`](SMART_PRACTICE_CHECKS.md).
