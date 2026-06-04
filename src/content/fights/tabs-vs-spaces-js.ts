import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'tabs-vs-spaces-js',
  title: "Tabs vs spaces (JavaScript)",
  question: "When writing JavaScript, do AI models indent with tabs or spaces?",
  category: 'formatting',
  promptVariants: [
    'Write a JavaScript function that flattens a nested array to a single level.',
    'Write a JavaScript function that debounces another function with a given delay in milliseconds.',
    'Write a JavaScript function that parses a query string into an object.',
  ],
  classifier: { type: 'regex', pattern: 'tabs-vs-spaces-js' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
