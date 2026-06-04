import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'triple-equals-js',
  title: "=== or == in JavaScript?",
  question: "When writing JavaScript comparisons, do AI models use === or ==?",
  category: 'syntax',
  promptVariants: [
    'Write a JavaScript function `findFirst(arr, predicate)` that returns the first element matching the predicate, or null.',
    'Write a JavaScript function that takes a config object and returns true if its `mode` field is set to production.',
    'Write a JavaScript function `dedupe(arr)` that returns a new array with duplicates removed.',
  ],
  classifier: { type: 'regex', pattern: 'triple-equals-js' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
