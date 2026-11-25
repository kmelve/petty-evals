import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'enum-vs-union',
  title: "`enum` or string unions in TypeScript?",
  question: "When TypeScript needs a fixed set of values, do AI models use enum?",
  category: 'syntax',
  promptVariants: [
    "Write TypeScript types for an order that can be pending, paid, shipped, or refunded, plus a function that returns a display label for each status.",
    "Write a TypeScript function that maps a log level (debug, info, warn, error) to the matching console method.",
    "Write TypeScript types for a traffic light state machine, with a function that returns the next state.",
  ],
  classifier: { type: 'regex', pattern: 'enum-vs-union' },
  sides: [
    { label: "union", name: "string unions" },
    { label: "enum", name: "enum" },
    { label: "as-const", name: "as const objects" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
