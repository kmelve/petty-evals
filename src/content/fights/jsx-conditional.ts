import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'jsx-conditional',
  title: "`&&` or a ternary in JSX?",
  question: "For conditional rendering in React, do AI models write `cond && <X />` or `cond ? <X /> : null`?",
  category: 'style',
  promptVariants: [
    "Write a React component that shows an error banner only when there's an error message.",
    "Write a React component for a product card that shows a 'Sale' badge only when the product is discounted.",
    "Write a React component that shows a 'Load more' button only when there are more items to fetch.",
  ],
  classifier: { type: 'regex', pattern: 'jsx-conditional' },
  sides: [
    { label: "and", name: "&&" },
    { label: "ternary", name: "? : null" },
    { label: "early-return", name: "if (!x) return null" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
