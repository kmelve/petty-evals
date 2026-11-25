import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'default-vs-named-exports',
  title: "Default or named exports?",
  question: "When writing a module or a React component, do AI models reach for export default?",
  category: 'syntax',
  promptVariants: [
    "Write a React component that shows a user's avatar, name, and a follow button.",
    "Write a small TypeScript module with helper functions for formatting prices and dates.",
    "Write a React hook, in its own file, that tracks whether the browser is online or offline.",
  ],
  classifier: { type: 'regex', pattern: 'default-vs-named-exports' },
  sides: [
    { label: "named", name: "named exports" },
    { label: "default", name: "export default" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
