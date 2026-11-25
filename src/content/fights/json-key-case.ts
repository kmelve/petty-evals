import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'json-key-case',
  title: "camelCase or snake_case JSON?",
  question: "Designing JSON for an API or a config file, which key style do AI models pick?",
  category: 'api',
  promptVariants: [
    "Design the JSON response for an API endpoint that returns a user's profile and their last five orders.",
    "Design the JSON payload a webhook sends when a subscription is renewed.",
    "Show an example JSON config file for a static site generator with options for the site title, base URL, build output directory, and default language.",
  ],
  classifier: { type: 'regex', pattern: 'json-key-case' },
  sides: [
    { label: "camelCase", name: "camelCase" },
    { label: "snake_case", name: "snake_case" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
