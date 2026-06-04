import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'interface-vs-type-ts',
  title: "interface or type in TypeScript?",
  question: "When declaring object shapes in TypeScript, do AI models use interface or type?",
  category: 'syntax',
  promptVariants: [
    'Write a TypeScript declaration for a `User` shape with id, name, email, and optional avatar URL.',
    'Write a TypeScript function `parseEvent(raw: unknown)` that returns a typed `Event` with name, timestamp, and payload. Declare the Event shape.',
    'Write a TypeScript function that takes a `RequestOptions` object (method, url, headers, body) and returns a fetch Promise. Declare RequestOptions.',
  ],
  classifier: { type: 'regex', pattern: 'interface-vs-type-ts' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
