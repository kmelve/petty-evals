import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'indent-width-js',
  title: "2-space or 4-space indent (JavaScript)?",
  question: "When writing JavaScript, do AI models indent with 2 spaces or 4?",
  category: 'formatting',
  promptVariants: [
    'Write a JavaScript function that groups an array of objects by a given key.',
    'Write a JavaScript function that converts a snake_case string to camelCase.',
    'Write a JavaScript function that retries a callback up to N times if it throws.',
  ],
  classifier: { type: 'regex', pattern: 'indent-width-js' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
