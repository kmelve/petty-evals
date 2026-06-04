import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'test-file-location',
  title: "Tests next to source or in __tests__?",
  question: "When sketching out a project layout with tests, where do AI models put the test files?",
  category: 'architecture',
  promptVariants: [
    'Show the file layout for a small TypeScript library called `string-utils` that exports `capitalize` and `truncate`, with tests for each.',
    'Show the file layout for a Node.js CLI tool called `tally` with a `commands/` directory and unit tests.',
    'Show the directory tree for a React component library called `bits` with three components (Button, Card, Modal) and tests.',
  ],
  classifier: { type: 'regex', pattern: 'test-file-location' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
