import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'let-vs-const-default',
  title: "let or const by default?",
  question: "When declaring local variables in JavaScript, do AI models reach for let or const first?",
  category: 'style',
  promptVariants: [
    'Write a JavaScript function that computes the average of an array of numbers.',
    'Write a JavaScript function that takes a list of users and returns the ones with `active: true`, sorted by name.',
    'Write a JavaScript function that builds a URL with a base path and a query parameters object.',
  ],
  classifier: { type: 'regex', pattern: 'let-vs-const-default' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
