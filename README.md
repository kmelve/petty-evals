# Petty Evals

> Rigorous benchmarks for problems that don't matter.

A benchmark suite for the developer community's stupidest holy wars. Tabs vs
spaces. `===` vs `==`. `let` vs `const`. We run identical realistic coding
prompts across frontier LLMs, classify what they actually produce, and publish
the verdicts as if civilization depended on them.

The website is static Astro. The pipeline is a small TypeScript library under
`src/lib/eval/`. Both are designed to be read.

## Quick start

```bash
pnpm install
pnpm dev                            # site at localhost:4321
pnpm build                          # static output to dist/
pnpm check                          # astro check (TS + Astro)
pnpm test                           # unit tests
pnpm evals --fight=tabs-vs-spaces-python --dry-run   # print run plan + cost
pnpm models:popular                 # OpenRouter's top coding models vs the panel
```

## Running a real eval

Every model is called through [OpenRouter](https://openrouter.ai), so you
need one key:

```bash
cp .env.example .env               # then paste your OPENROUTER_API_KEY
pnpm evals --fight=tabs-vs-spaces-python --smoke   # one call per model
pnpm evals --fight=all                             # the whole thing
```

Results are written to `src/data/results/<slug>.json`. Commit that file. The
Astro site reads it at build time.

## Repository layout

```
src/
├── content/fights/         Fight definitions (TS + zod-validated)
├── data/results/           Output JSON, one file per fight
├── lib/eval/               The pipeline as a library
│   ├── providers/          The panel roster + the OpenRouter client
│   ├── classifiers/        Regex + LLM-judge classification primitives
│   ├── runner.ts           Orchestrates N runs across providers
│   ├── stats.ts            Wilson CI, Shannon entropy, Cohen's kappa
│   ├── pundit.ts           Post-vote one-sentence reaction prompt
│   └── report.ts           Writes the FightResult JSON
├── pages/                  Astro pages (homepage, fight detail, OG cards)
├── components/             Astro components
└── styles/global.css       Tailwind v4 + minimal custom CSS

scripts/
└── run-evals.ts            CLI entry point
```

## Stack

- **Astro 6** — static site, content collections for fights and results
- **Tailwind v4** via `@tailwindcss/vite` (the Astro integration is deprecated)
- **AI SDK v6** (`ai`) + `@openrouter/ai-sdk-provider`: one key, every lab
- **zod** for fight schema validation
- **p-limit** for bounded run concurrency

## Methodology

See [methodology.astro](./src/pages/methodology.astro) or the rendered page at
`/methodology`. The short version: 10 runs per (model × prompt variant ×
temperature), two temperatures, three prompt variants. Modal vote per model.
Wilson 95% CI on the proportion. Shannon entropy of the across-model vote
distribution as the Disagreement Index. Cohen's kappa for classifier reliability
against a hand-labeled subsample.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The contribution model is: open a
PR adding a single TypeScript file to `src/content/fights/` plus a classifier
if needed. A maintainer runs the pipeline and merges the result.

## Status

V1 scaffold (Day 2 of 7). The pipeline is wired but the launch pipeline run has
not yet executed; the homepage and fight detail page render placeholder data
with an honest "placeholder" badge until that changes.
