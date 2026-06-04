import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'early-return-vs-nested',
  title: "Early return or nested if/else?",
  question: "When handling multiple input conditions, do AI models prefer early returns or nested if/else?",
  category: 'style',
  promptVariants: [
    'Write a JavaScript function `classifyAge(age)` that returns "child" if age < 13, "teen" if age < 20, "adult" if age < 65, otherwise "senior". Reject negative or non-numeric input.',
    'Write a JavaScript function `validateUser(user)` that returns an error string if name is missing, email is missing, or age is below 18; otherwise returns null.',
    'Write a JavaScript function `httpStatusBucket(code)` that returns "info", "success", "redirect", "client-error", or "server-error" based on the status code. Reject codes outside 100..599.',
  ],
  classifier: { type: 'regex', pattern: 'early-return-vs-nested' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
