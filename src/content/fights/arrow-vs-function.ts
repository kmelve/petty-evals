import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'arrow-vs-function',
  title: "Arrow functions or function declarations?",
  question: "When defining top-level functions in JavaScript, do AI models use arrow expressions or function declarations?",
  category: 'syntax',
  promptVariants: [
    'Write a JavaScript module that exports three small utilities: `clamp`, `lerp`, and `randomInt`.',
    'Write a JavaScript file that exports a function `slugify(str)` and a helper `stripAccents(str)`.',
    'Write a JavaScript file that exports `formatDate(date)` and `parseDate(str)` for ISO-8601 dates.',
  ],
  classifier: { type: 'regex', pattern: 'arrow-vs-function' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
