import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'grid-vs-flexbox',
  title: "CSS grid or flexbox?",
  question: "Asked for a grid-shaped layout, do AI models use CSS grid or flexbox?",
  category: 'css',
  promptVariants: [
    "Write the HTML and CSS for a responsive grid of product cards, three per row on desktop and one per row on mobile.",
    "Write the HTML and CSS for a photo gallery page with evenly sized thumbnails.",
    "Write the HTML and CSS for a pricing section with three plan cards side by side.",
  ],
  classifier: { type: 'regex', pattern: 'grid-vs-flexbox' },
  sides: [
    { label: "grid", name: "CSS grid" },
    { label: "flexbox", name: "flexbox" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
