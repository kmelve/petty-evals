import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'quotes-js',
  title: "Single or double quotes (JavaScript)?",
  question: "When writing JavaScript string literals, do AI models prefer single or double quotes?",
  category: 'formatting',
  promptVariants: [
    'Write a JavaScript function that returns a greeting given a name and a time of day.',
    'Write a JavaScript function that constructs a log line from a level, a message, and a timestamp.',
    'Write a JavaScript function that builds an HTTP Authorization header value for Bearer token auth.',
  ],
  classifier: { type: 'regex', pattern: 'quotes-js' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
