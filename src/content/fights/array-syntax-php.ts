import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'array-syntax-php',
  title: '`array()` or `[]` in PHP?',
  question: 'In PHP, do AI models use `array(...)` or the short `[...]` syntax?',
  category: 'syntax',
  promptVariants: [
    'Write a PHP function that takes a list of users (associative arrays with `name` and `email`) and returns only those whose email ends in `@example.com`.',
    'Write a PHP function that returns an associative array mapping HTTP status codes (200, 404, 500) to their descriptions.',
    'Write a PHP function that takes a 2D array of integers and returns the sum of each row as a new array.',
  ],
  classifier: { type: 'regex', pattern: 'array-syntax-php' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-04',
};

export default fight;
