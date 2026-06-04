import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'react-styling',
  title: "CSS-in-JS, CSS files, or Tailwind?",
  question: "When styling a React component, which approach do AI models reach for?",
  category: 'tooling',
  promptVariants: [
    'Write a React component for a primary action button. Include hover and disabled states.',
    'Write a React component that displays a product card with an image, title, and price.',
    'Write a React modal component with a darkened backdrop and a centered content panel.',
  ],
  classifier: { type: 'regex', pattern: 'react-styling' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
