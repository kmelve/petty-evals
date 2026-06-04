import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'trailing-commas-js',
  title: "Trailing commas in JavaScript?",
  question: "When writing multi-line arrays and objects in JavaScript, do AI models add a trailing comma?",
  category: 'formatting',
  promptVariants: [
    'Write a JavaScript module that exports a config object with five fields: host, port, timeout, retries, and debug. Use realistic default values.',
    'Write a JavaScript function that returns an array of weekday names starting from Monday. Format the array literal on multiple lines.',
    'Write a JavaScript function that returns an object mapping HTTP status codes (200, 301, 404, 500) to short human-readable labels.',
  ],
  classifier: { type: 'regex', pattern: 'trailing-commas-js' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
