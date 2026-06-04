import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'except-granularity',
  title: "Broad or narrow try/except (Python)?",
  question: "When handling errors in Python, do AI models catch broad or narrow exception types?",
  category: 'style',
  promptVariants: [
    'Write a Python function that reads a JSON file from disk and returns the parsed object, handling errors gracefully.',
    'Write a Python function that parses an integer from a string and returns a default if parsing fails.',
    'Write a Python function that fetches a URL with `urllib.request` and returns the body, returning None on failure.',
  ],
  classifier: { type: 'regex', pattern: 'except-granularity' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
