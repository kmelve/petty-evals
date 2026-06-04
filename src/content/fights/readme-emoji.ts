import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'readme-emoji',
  title: "Emoji in README headings?",
  question: "When writing a README, do AI models put emoji in section headings?",
  category: 'formatting',
  promptVariants: [
    "Write a README.md for a small open-source library called 'tiny-date' that formats dates relative to now (e.g., '5 minutes ago').",
    "Write a README.md for a CLI tool called 'flak' that lints YAML files.",
    "Write a README.md for a React component library called 'paw' with 12 small UI primitives.",
  ],
  classifier: { type: 'regex', pattern: 'readme-emoji' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
