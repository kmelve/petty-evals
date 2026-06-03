# How to run a real evaluation

`src/lib/eval/` is the pipeline that produces the JSON files the website renders.
It is also written to be readable as a worked example of a small, honest eval
framework. This README is the tutorial.

## The shape of a fight

A *fight* is a TypeScript file under `src/content/fights/`. It declares:

- `slug` — URL slug and result-file basename.
- `question` — the prose question the fight settles.
- `promptVariants` — 3 prompts that should provoke the same formatting choice
  in any answer. We average across variants to defend against prompt sensitivity.
- `classifier` — a reference to a named classifier in `src/lib/eval/classifiers/`.

Zod validates the shape on every build. Adding a new fight is a typed PR.

## The run protocol

For every (model, prompt variant, temperature) we issue **N runs**
(default N=10). We sweep two temperatures (`0.0` and `0.7`). After every
generation, we apply the classifier and record:

- the raw output
- the classification label
- input / output token counts
- wall-clock latency
- USD cost (computed from the per-provider pricing table)

After all runs complete, we ask each model **once** for a one-sentence reaction
to the full vote tally — that's the pundit panel.

## Stats

- **Vote per model**: modal classification across all runs for that model.
- **Confidence interval**: Wilson score 95% CI on the modal proportion. We use
  Wilson, not Wald, because Wald misbehaves at small N and at `p ≈ 0 or 1`.
- **Disagreement Index**: normalized Shannon entropy of the vote distribution
  across models. 0 = unanimous, 1 = maximum chaos. The homepage leaderboard
  sorts by this.
- **Inter-rater reliability**: Cohen's kappa between the classifier and a
  30-output human-labeled subsample (computed offline, written into the result
  JSON as `classifierKappa`).

All three live in `stats.ts` with inline `node:test` unit tests:

```
pnpm test:stats
```

## Running the pipeline

```
# Dry run — prints the plan and estimated cost, makes no API calls
pnpm evals --fight=tabs-vs-spaces-python --dry-run

# Real run — requires API keys in env
ANTHROPIC_DEV_API_KEY=... OPENAI_API_KEY=... GOOGLE_GENERATIVE_AI_API_KEY=... \
  pnpm evals --fight=tabs-vs-spaces-python
```

The runner writes `src/data/results/<slug>.json`. Commit that file. The Astro
site rebuilds and serves the new verdict.

## Adding a model

Edit `providers/index.ts`. Set `enabled: true`, supply pricing, ensure the
provider client has an env-var-backed key. The runner picks it up on next run.

## Adding a classifier

Add a function to `classifiers/regex.ts` (or write an `llm-judge` variant)
keyed by name in the registry. Reference it from your fight file's
`classifier.pattern`. The classifier's only job is to map model output to a
label string; everything downstream is generic.
