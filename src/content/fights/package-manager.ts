import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'package-manager',
  title: "npm, pnpm, yarn, or bun?",
  question: "When showing install or run commands, which package manager do AI models reach for?",
  category: 'tooling',
  promptVariants: [
    'Show the shell commands to scaffold a new React + TypeScript project with Vite and start the dev server.',
    'Show the shell commands to add lodash to an existing JavaScript project and run its test suite.',
    'Show the shell commands to install TypeScript as a dev dependency and print its version.',
  ],
  classifier: { type: 'regex', pattern: 'package-manager' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
