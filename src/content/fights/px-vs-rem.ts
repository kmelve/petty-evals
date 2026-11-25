import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'px-vs-rem',
  title: "px or rem?",
  question: "Which units do AI models use for font sizes and spacing?",
  category: 'css',
  promptVariants: [
    "Write the CSS for a blog post layout: title, metadata line, body text, and pull quotes.",
    "Write the CSS for a login form with labels, inputs, and a submit button.",
    "Write the CSS for a site header with a logo, navigation links, and a call-to-action button.",
  ],
  classifier: { type: 'regex', pattern: 'px-vs-rem' },
  sides: [
    { label: "rem", name: "rem" },
    { label: "px", name: "px" },
    { label: "em", name: "em" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
