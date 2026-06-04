import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'quotes-python',
  title: "Single or double quotes (Python)?",
  question: "When writing Python string literals, do AI models prefer single or double quotes?",
  category: 'formatting',
  promptVariants: [
    'Write a Python function that returns a greeting given a name and a time of day.',
    'Write a Python function that takes a dict and returns a single-line summary string.',
    'Write a Python function that constructs an HTTP Authorization header value for Bearer token auth.',
  ],
  classifier: { type: 'regex', pattern: 'quotes-python' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
