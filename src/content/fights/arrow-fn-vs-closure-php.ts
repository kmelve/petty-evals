import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'arrow-fn-vs-closure-php',
  title: 'Arrow fns or full closures (PHP)?',
  question: 'Do AI models use PHP arrow functions (`fn() =>`) or full closures (`function() { ... }`)?',
  category: 'syntax',
  promptVariants: [
    'Write a PHP function that uses `array_map` to convert an array of prices in cents to dollars (divide each by 100).',
    'Write a PHP function that uses `array_filter` to return only the active users from an array of user objects.',
    'Write a PHP function that uses `usort` to sort an array of products by price ascending.',
  ],
  classifier: { type: 'regex', pattern: 'arrow-fn-vs-closure-php' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-04',
};

export default fight;
