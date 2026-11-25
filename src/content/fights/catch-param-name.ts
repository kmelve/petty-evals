import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'catch-param-name',
  title: "`catch (e)`, `catch (err)` or `catch (error)`?",
  question: "What do AI models name the error in a catch block?",
  category: 'style',
  promptVariants: [
    "Write a JavaScript function that reads a JSON config file and returns defaults if it's missing or invalid.",
    "Write a TypeScript function that fetches a user profile from an API and returns null if the request fails.",
    "Write a Node.js script that copies a directory and prints a friendly message if anything goes wrong.",
  ],
  classifier: { type: 'regex', pattern: 'catch-param-name' },
  sides: [
    { label: "error", name: "catch (error)" },
    { label: "err", name: "catch (err)" },
    { label: "e", name: "catch (e)" },
  ],
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
