# The Proof marker problem library

The Proof marker is only as good as the material it marks against. Each problem in the library is one file in `marking/problems/`, written by you. The marker reads your intended solutions, your mark scheme, your list of fatal errors and your marked examples every time it marks a student's script, so the more carefully these are written, the better it marks.

## Adding a problem

1. Copy `marking/TEMPLATE.md` into `marking/problems/` and rename it, for example `marking/problems/bmo1-2024-3.md`. The name must match the `id:` line inside the file.
2. Fill in every section. The three drafted problems already in the folder (`kmo-1.md`, `kmo-2.md`, `kmo-3.md`) show the format in use.
3. Open PowerShell in your site folder and run:

   ```
   node tools/build-marking.js
   ```

   If something is wrong, it tells you the file, the line and what to fix, and writes nothing. If everything is fine, it rebuilds `marking/library.js`, which is the file the website reads.
4. Commit and push both your `.md` file and the new `marking/library.js`.

To check your files without rebuilding anything, run `node tools/build-marking.js --check`.

## The mark scheme

- `- [2] what earns the marks`: a checkpoint worth 2 marks. Write it as what the candidate must show, so the marker can say yes or no.
- `- [3] (Route A) ...`: a checkpoint that only belongs to one approach. Every route, added to the shared checkpoints, must total `max`. The marker scores the route that gives the candidate the most marks.
- `- Cap 5: ...`: a situation that limits the total, whatever else is right.

The tool refuses to build if the numbers do not add up.

## Marked examples

These matter more than anything else. Give at least three per problem: one with full marks, one typical partial answer, and one that looks convincing but contains a false step. Write each in a student's voice, then a `Mark:` line and a `Comment:` line like an examiner's margin note.

## Draft or reviewed

`reviewed: false` problems appear on the site with a "Draft scheme" label. When you have checked every part of a problem and you are happy with it, change the line to `reviewed: true`, rebuild and push. The three problems already in the folder were drafted by Claude from your Mock BMO solutions and are marked `reviewed: false` until you check them.

## Measuring the marker

See `marking/eval/README.md`. In short: you mark some scripts yourself, the tool runs the real marker on them, and it reports how often the marker agrees with you.
