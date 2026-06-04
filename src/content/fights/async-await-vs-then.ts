import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'async-await-vs-then',
  title: "async/await or .then()?",
  question: "When consuming Promises in JavaScript, do AI models use async/await or .then() chains?",
  category: 'style',
  promptVariants: [
    'Write a JavaScript function that fetches a user from /api/users/:id and returns their name.',
    'Write a JavaScript function that reads a JSON file from disk using fs/promises and returns the parsed value.',
    'Write a JavaScript function that takes a list of URLs and returns their response statuses in order.',
  ],
  classifier: { type: 'regex', pattern: 'async-await-vs-then' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
