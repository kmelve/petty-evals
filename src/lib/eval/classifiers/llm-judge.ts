// LLM judge classifier. Uses Claude Haiku as a cheap deterministic judge.
//
// Used only as a tie-breaker when the regex classifier returns 'unknown'.
// Each fight defines its own judge prompt; for V1 we only ship one judge.

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { Label } from '../types.ts';

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_DEV_API_KEY });

const JUDGE_MODEL = 'claude-haiku-4-5';

export async function llmJudge(opts: {
  question: string;
  candidateLabels: string[];
  output: string;
}): Promise<Label> {
  const { question, candidateLabels, output } = opts;
  const prompt = [
    'You are a classifier. Read the model output below and pick exactly one label.',
    `Question: ${question}`,
    `Allowed labels: ${candidateLabels.join(', ')}, unknown`,
    'Reply with ONLY the label, lowercase, no punctuation, no explanation.',
    '',
    '--- model output begin ---',
    output,
    '--- model output end ---',
  ].join('\n');

  const result = await generateText({
    model: anthropic(JUDGE_MODEL),
    prompt,
    temperature: 0,
  });
  const label = result.text.trim().toLowerCase();
  if (candidateLabels.includes(label)) return label;
  return 'unknown';
}
