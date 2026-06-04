import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'triple-equals-php',
  title: '`===` or `==` in PHP?',
  question: 'In PHP, do AI models use `===` (strict) or `==` (loose)?',
  category: 'syntax',
  promptVariants: [
    'Write a PHP function that takes an order status string and returns a human-readable label for `pending`, `shipped`, `delivered`, or `cancelled`.',
    'Write a PHP function that takes an array of integers and returns true if any element equals zero.',
    'Write a PHP function `isAdmin($user)` that takes a user object and returns true if the user has the admin role.',
  ],
  classifier: { type: 'regex', pattern: 'triple-equals-php' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-04',
};

export default fight;
