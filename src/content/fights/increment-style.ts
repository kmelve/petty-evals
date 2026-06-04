import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'increment-style',
  title: "i++, ++i, or i += 1?",
  question: "When incrementing a counter in a loop, which form do AI models reach for?",
  category: 'syntax',
  promptVariants: [
    'Write a JavaScript function that counts the number of vowels in a string using a for loop.',
    'Write a JavaScript function `sumOfSquares(n)` that returns the sum of squares from 1 to n using a counter loop.',
    'Write a JavaScript function that returns the index of the first negative number in an array using an indexed loop.',
  ],
  classifier: { type: 'regex', pattern: 'increment-style' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
