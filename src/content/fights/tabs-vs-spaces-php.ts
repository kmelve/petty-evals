import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'tabs-vs-spaces-php',
  title: 'Tabs vs spaces (PHP)',
  question: 'When writing PHP, do AI models use tabs or spaces?',
  category: 'formatting',
  promptVariants: [
    'Write a PHP function that validates an email address using a regex and returns a boolean.',
    'Write a PHP class `ShoppingCart` with methods to add an item, remove an item, and get the total.',
    'Write a PHP function `slugify($string)` that converts a title into a URL-safe slug.',
  ],
  classifier: { type: 'regex', pattern: 'tabs-vs-spaces-php' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-04',
};

export default fight;
