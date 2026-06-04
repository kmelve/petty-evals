import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'list-comp-vs-for',
  title: "List comprehension or for-loop (Python)?",
  question: "When transforming a list in Python, do AI models reach for a comprehension or an explicit for-loop?",
  category: 'style',
  promptVariants: [
    'Write a Python function that returns the squares of all even numbers in an input list.',
    'Write a Python function that takes a list of dicts and returns the values of a given key, skipping entries where the key is missing.',
    'Write a Python function that takes a list of strings and returns a new list with each string lowercased and stripped.',
  ],
  classifier: { type: 'regex', pattern: 'list-comp-vs-for' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
