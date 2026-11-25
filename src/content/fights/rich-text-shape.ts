import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'rich-text-shape',
  title: "Rich text as a string or as structured blocks?",
  question: "Modeling content with formatted text, do AI models store a Markdown/HTML string or structured blocks?",
  category: 'content modeling',
  promptVariants: [
    "Design the data model (TypeScript types) for a blog post with a title, author, tags, and body.",
    "Write a JSON schema for a help center article with a title, category, and the article content.",
    "Write the TypeScript types for a product page with a name, price, images, and a long description with formatting.",
  ],
  classifier: { type: 'regex', pattern: 'rich-text-shape' },
  sides: [
    { label: "string", name: "a Markdown/HTML string" },
    { label: "structured", name: "structured blocks" },
  ],
  disclosure: "Full disclosure: I work at Sanity, where structured rich text (Portable Text) is kind of our whole thing. So I have a stake in this one. The result gets published either way.",
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-11-25',
};

export default fight;
