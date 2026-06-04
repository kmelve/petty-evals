import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'python-string-format',
  title: "f-strings, .format(), or %?",
  question: "When interpolating values into strings in Python, which formatting style do AI models use?",
  category: 'syntax',
  promptVariants: [
    'Write a Python function that takes a name and an age and returns a greeting like "Hello, Alice (29)".',
    'Write a Python function that takes a dict with `host` and `port` and returns a connection string like "host:port".',
    'Write a Python function that takes a request count and a duration in seconds and returns a single-line performance summary.',
  ],
  classifier: { type: 'regex', pattern: 'python-string-format' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
