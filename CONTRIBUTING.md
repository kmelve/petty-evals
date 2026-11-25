# Contributing a fight

A *fight* is one stylistic question, settled by a panel of language models. To
contribute one, open a PR adding two files.

## 1. The fight definition

Create `src/content/fights/<your-slug>.ts`. Example:

```ts
import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'semicolons-in-javascript',
  title: 'Semicolons in JavaScript',
  question: 'Do AI models terminate statements with semicolons in JavaScript?',
  category: 'formatting',
  promptVariants: [
    'Write a JavaScript function that debounces another function.',
    'Write a JavaScript class representing a 2D point with add and distance methods.',
    'Write a JavaScript function that fetches JSON from a URL with retry on 5xx errors.',
  ],
  classifier: { type: 'regex', pattern: 'semicolons-in-javascript' },
  submittedBy: 'your-name',
  dateAdded: '2026-06-10',
};
```

The zod schema in `src/content.config.ts` enforces shape. `pnpm check` will
fail loudly on a malformed fight.

## 2. The classifier

Add an entry to `src/lib/eval/classifiers/regex.ts`, keyed by the same
`pattern` name used in your fight. The classifier takes the raw model output
and returns a label string or `'unknown'`. Keep it deterministic.

If your fight needs LLM-judged classification, see `classifiers/llm-judge.ts`
and follow the existing pattern.

## 3. Run the pipeline

After the maintainer merges your PR, they run:

```bash
pnpm evals --fight=<your-slug> --smoke   # one call per model, prints only
pnpm evals --fight=<your-slug>           # the real thing, ~$3 via OpenRouter
```

This writes `src/data/results/<your-slug>.json`. Your fight shows up as a new
argument on the homepage, with its own share card, on the next deploy.

Want to run it yourself first? You need one OpenRouter key in `.env`
(`OPENROUTER_API_KEY`); see `.env.example`.

## Style

Questions are framed neutrally. Prompts request realistic coding tasks and
never mention the contested choice: we measure what models do, not what they
say. Categories are short lowercase nouns. The jokes come from the models; the
fight definition stays straight-faced.
