# Measuring the Proof marker

This folder holds test scripts: solutions you have marked yourself, kept separate from the marked examples inside each problem file. The marker never sees these scripts while marking, so they are a fair test of how often it agrees with you.

## Adding a test script

Make a folder named after the problem's id, for example `marking/eval/kmo-1/`, and add one file per script:

```
---
mark: 6
sound: false
comment: Proves the parity step and small cases; the mod 3 step is asserted.
reviewed: true
---
The student's solution goes here, exactly as they wrote it.
```

- `mark` is your mark.
- `sound` is optional. Leave it out and the tool assumes a full-marks script is sound and anything else is not.
- `reviewed: false` keeps a script out of normal runs until you have marked it properly.

Real student scripts (with permission, and with names removed) are the best test material. Vary them: strong, weak, and especially the convincing-but-wrong ones.

## Running the test

You need Node and an API key for the model you want to test. In PowerShell, in your site folder:

```
$env:ANTHROPIC_API_KEY="your-key"
node tools/eval-marker.js --dry-run
node tools/eval-marker.js --price-in 3 --price-out 15
```

`--dry-run` lists the scripts and estimates the size of the run without sending anything. The real run shows an estimate and asks before it starts. Use `--provider gemini` with `GEMINI_API_KEY`, or `--provider openai` with `OPENAI_API_KEY`, to test other models. The prices are dollars per million tokens from your provider's pricing page.

## What it reports

Per problem and overall:

- **Within 1 mark**: how often the marker lands within one mark of you. This is the headline figure.
- **Mean difference**: the average gap, and whether the marker tends to be generous or harsh.
- **Called unsound proofs sound**: the most dangerous failure, a broken proof passed as correct.
- **Called sound proofs unsound**: complete proofs wrongly failed.
- **Flagged uncertain**: how often the two passes disagreed.

Every run is saved in `marking/eval/results/`, so you can see whether a change to a mark scheme or the prompts helped.

## The figure on the website

After a full two-pass run of at least 50 reviewed scripts, the tool updates `marking/eval/latest.js`, and the Proof marker page shows "within 1 mark of a human examiner on N% of test scripts" once you push it. Below 50 scripts the page shows nothing, because a figure from a handful of scripts would mislead.

The two scripts in `marking/eval/kmo-1/` are examples of the format, drafted by Claude and marked `reviewed: false`. Replace them with your own.
