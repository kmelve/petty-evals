import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'conventional-commits',
  title: "Conventional Commits or plain commit messages?",
  question: "Asked for a commit message, do AI models write feat(scope): ...?",
  category: 'tooling',
  promptVariants: [
    "Write a commit message for this change:\n\n- if (!email) return false;\n+ if (!email || !email.includes('@')) {\n+   return { ok: false, error: 'Please enter a valid email address.' };\n+ }",
    "Write a commit message for a change that bumps react from 18.2.0 to 18.3.1 in package.json and updates the lockfile.",
    "Write a commit message for a fix: the dark mode toggle didn't remember the user's choice after a page reload, so I now save it to localStorage.",
  ],
  classifier: { type: 'regex', pattern: 'conventional-commits' },
  sides: [
    { label: "conventional", name: "feat: / fix:" },
    { label: "plain", name: "plain sentences" },
    { label: "gitmoji", name: "gitmoji" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
