import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'jsdoc-vs-types',
  title: "JSDoc or TypeScript types?",
  question: "When asked to document a function well, do AI models reach for JSDoc or TypeScript?",
  category: 'architecture',
  promptVariants: [
    'Write a utility function `groupBy(arr, keyFn)` that groups array items by a derived key. Document it well.',
    'Write a small `Cache` class with `get`, `set`, `has`, and `delete` methods. Document the public API.',
    'Write a function `fetchWithRetry(url, options, retries)` that retries on failure with exponential backoff. Document it well.',
  ],
  classifier: { type: 'regex', pattern: 'jsdoc-vs-types' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
