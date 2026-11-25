import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'foreach-vs-for-of',
  title: "forEach or for…of?",
  question: "When looping over an array for side effects, which loop do AI models write?",
  category: 'syntax',
  promptVariants: [
    "Write a JavaScript function that sends a welcome email to each user in a list, using a provided sendEmail(user) function.",
    "Write a JavaScript function that logs a warning for every key in a config object that isn't in an allowed list.",
    "Write a JavaScript function that adds each product in an array to a shopping cart Map, increasing the quantity if it's already there.",
  ],
  classifier: { type: 'regex', pattern: 'foreach-vs-for-of' },
  sides: [
    { label: "for-of", name: "for…of" },
    { label: "foreach", name: ".forEach()" },
    { label: "for-index", name: "for (let i…)" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
