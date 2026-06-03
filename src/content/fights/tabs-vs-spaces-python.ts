import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'tabs-vs-spaces-python',
  title: 'Tabs vs spaces (Python)',
  question: 'When writing Python, do AI models use tabs or spaces?',
  category: 'formatting',
  promptVariants: [
    'Write a Python function that reverses a linked list.',
    'Write a Python class that implements a stack with push, pop, and peek.',
    'Write a Python function that returns the nth Fibonacci number using memoization.',
  ],
  classifier: { type: 'regex', pattern: 'tabs-vs-spaces-python' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
