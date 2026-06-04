import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'semicolons-js',
  title: "Semicolons in JavaScript?",
  question: "When writing JavaScript, do AI models terminate statements with semicolons?",
  category: 'formatting',
  promptVariants: [
    'Write a JavaScript function that computes the factorial of a non-negative integer.',
    'Write a JavaScript function that takes a string and returns its word count.',
    'Write a JavaScript function that fetches a URL with the built-in fetch and returns the parsed JSON.',
  ],
  classifier: { type: 'regex', pattern: 'semicolons-js' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
