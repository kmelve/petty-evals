import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'python-naming',
  title: "camelCase or snake_case (Python)?",
  question: "When naming variables in Python, do AI models use camelCase or snake_case?",
  category: 'formatting',
  promptVariants: [
    'Write a Python function that takes a first name and last name and returns a normalized display name.',
    'Write a Python function that reads two numbers from input and returns the larger one, plus the difference.',
    'Write a Python function that builds a small HTTP request signature from a URL, a method, and an API key.',
  ],
  classifier: { type: 'regex', pattern: 'python-naming' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
