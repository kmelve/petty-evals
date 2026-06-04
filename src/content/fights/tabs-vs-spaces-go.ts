import type { Fight } from '../../lib/eval/types.ts';

export const fight: Fight = {
  slug: 'tabs-vs-spaces-go',
  title: "Tabs vs spaces (Go)",
  question: "When writing Go, do AI models indent with tabs or spaces?",
  category: 'formatting',
  promptVariants: [
    'Write a Go function `Reverse(s string) string` that reverses a UTF-8 string.',
    'Write a Go function that reads a JSON file from disk and unmarshals it into a `Config` struct with `Name` and `Port` fields.',
    'Write a Go function `WorkerPool(jobs <-chan int, n int)` that spawns n goroutines to process jobs concurrently.',
  ],
  classifier: { type: 'regex', pattern: 'tabs-vs-spaces-go' },
  submittedBy: 'petty-evals-team',
  dateAdded: '2026-06-03',
};

export default fight;
