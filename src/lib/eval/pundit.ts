// Pundit prompt — fired ONCE per model per fight, after all runs complete.
// Each model sees the vote tally + one representative sample per model,
// and returns a single-sentence reaction. These quotes are the marquee
// element of the fight page; see plan §"Model quotes — the pundit panel".

import { generateText } from 'ai';
import type { Fight, ModelConfig, RunRecord } from './types.ts';
import { resolveModel } from './providers/index.ts';

export interface PunditInput {
  fight: Fight;
  voteTally: Record<string, Record<string, number>>; // modelId -> label -> count
  representativeSamples: Record<string, string>; // modelId -> code sample
}

export function buildPunditPrompt(input: PunditInput): string {
  const lines: string[] = [];
  lines.push(`You are reviewing the results of an evaluation.`);
  lines.push(`Question under evaluation: ${input.fight.question}`);
  lines.push('');
  lines.push('Vote tally across all participating models:');
  for (const [modelId, dist] of Object.entries(input.voteTally)) {
    const parts = Object.entries(dist).map(([label, n]) => `${label}=${n}`).join(', ');
    lines.push(`  - ${modelId}: ${parts}`);
  }
  lines.push('');
  lines.push('One representative code sample per model:');
  for (const [modelId, sample] of Object.entries(input.representativeSamples)) {
    lines.push(`### ${modelId}`);
    lines.push('\`\`\`');
    lines.push(sample.slice(0, 500));
    lines.push('\`\`\`');
  }
  lines.push('');
  lines.push('In one sentence, what do you think of this result? No preamble.');
  return lines.join('\n');
}

/** Pick a run whose classification matches the model's modal vote. */
export function pickRepresentativeSample(runs: RunRecord[], modalVote: string): string {
  const matching = runs.find((r) => r.classification === modalVote);
  return (matching ?? runs[0]).output;
}

export async function callPundit(
  model: ModelConfig,
  prompt: string,
): Promise<string> {
  const result = await generateText({
    model: resolveModel(model),
    prompt,
    temperature: 0.3,
  });
  return result.text.trim();
}
