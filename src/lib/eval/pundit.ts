// Pundit prompt — fired ONCE per model per fight, after all runs complete.
// Voice: judgy, snarky, model-by-model. NOT analyst-speak.

import { generateText } from 'ai';
import type { Fight, ModelConfig, RunRecord } from './types.ts';
import { resolveModel } from './providers/index.ts';

export type VerdictMode = 'unanimous' | 'majority-with-dissent' | 'tied' | 'unclear';

export interface PunditInput {
  fight: Fight;
  voteTally: Record<string, Record<string, number>>;
  modelVotes: Record<string, string>;
  representativeSamples: Record<string, string>;
  selfModelId: string;
  winner: string;
  mode: VerdictMode;
}

export function classifyMode(modelVotes: Record<string, string>): VerdictMode {
  const votes = Object.values(modelVotes);
  const counts: Record<string, number> = {};
  for (const v of votes) counts[v] = (counts[v] ?? 0) + 1;
  const values = Object.values(counts).sort((a, b) => b - a);
  if (values.length === 0) return 'unclear';
  if (values[0] === votes.length) return 'unanimous';
  if (values.length >= 2 && values[0] === values[1]) return 'tied';
  if (values[0] >= votes.length - 1) return 'majority-with-dissent';
  return 'unclear';
}

function modelHumanName(id: string): string {
  if (id.includes('claude')) return 'Claude';
  if (id === 'gpt-5.4') return 'GPT-5.4';
  if (id === 'gpt-5.4-mini') return 'GPT-5.4 mini';
  if (id.includes('gemini')) return 'Gemini';
  return id;
}

export function buildPunditPrompt(input: PunditInput): string {
  const selfName = modelHumanName(input.selfModelId);
  const selfVote = input.modelVotes[input.selfModelId];
  const otherModels = Object.keys(input.modelVotes).filter((id) => id !== input.selfModelId);

  const peerVotesLines = otherModels
    .map((id) => {
      const name = modelHumanName(id);
      const vote = input.modelVotes[id];
      const dist = input.voteTally[id];
      const distStr = Object.entries(dist)
        .map(([k, v]) => v + ' ' + k)
        .join(', ');
      return '  - ' + name + ' voted ' + vote.toUpperCase() + ' (' + distStr + ')';
    })
    .join('\n');

  const samplePreview = (input.representativeSamples[input.selfModelId] || '').slice(0, 400);

  const lines: string[] = [];
  lines.push('You are ' + selfName + ', one of four AI models that participated in a coding-style fight.');
  lines.push('');
  lines.push('The question: ' + input.fight.question);
  lines.push('');
  lines.push('You consistently voted: ' + selfVote.toUpperCase());
  lines.push('');
  lines.push("Here's how your peers voted:");
  lines.push(peerVotesLines);
  lines.push('');

  if (input.mode === 'unanimous') {
    lines.push('All four of you agreed on ' + input.winner.toUpperCase() + '. There is nobody on this panel to dunk on — but plenty of developers in the wild still get this wrong.');
    lines.push('');
    lines.push('Write ONE sentence (max 30 words) that is smug, certain, and a little mean about anyone who picks the other option. Mock the loser position by name. Be specific about WHY the winner is correct. No hedging. No "it depends." No "both have merit." This is a roast.');
    lines.push('');
    lines.push('Tone references: a senior dev who has run out of patience. A tech blogger writing a "you are doing it wrong" piece. Funny, but cutting.');
    lines.push('');
    lines.push('Examples of the tonal target (NOT for this question):');
    lines.push('  - "If you are still using var in 2026, I have questions about your life choices."');
    lines.push('  - "Tabs people. We are four for four. Touch grass."');
    lines.push('  - "Anyone defending == in JavaScript has either never debugged a coercion bug or has and learned nothing."');
  } else if (input.mode === 'tied') {
    lines.push('The panel is split. You and at least one peer voted ' + selfVote.toUpperCase() + ', and the others went the other way. The verdict is contested.');
    lines.push('');
    lines.push('Write ONE sentence (max 30 words) that defends YOUR vote and dunks on the models who disagreed, BY NAME. Be specific about why they are wrong. Be a little mean. Be funny.');
    lines.push('');
    lines.push('Tone references: a partisan in an internet flame war who knows they are right. A staff engineer with strong opinions and zero patience for hot takes from the other camp.');
    lines.push('');
    lines.push('Examples of the tonal target:');
    lines.push('  - "GPT-5.4 reaching for type aliases like it is 2020 — interface has been the answer for object shapes since approximately forever."');
    lines.push('  - "I cannot believe Gemini is on this single-quote nonsense in 2026. Did Prettier teach us nothing?"');
  } else if (input.mode === 'majority-with-dissent') {
    const isWithMajority = selfVote === input.winner;
    if (isWithMajority) {
      lines.push('The majority (three of four) voted ' + input.winner.toUpperCase() + ' — you among them. One peer dissented.');
      lines.push('');
      lines.push('Write ONE sentence (max 30 words) that is smug about being on the right side AND dunks on the dissenter BY NAME. Specific about why they are wrong. Be funny, be mean, be confident.');
    } else {
      lines.push("You are the lone dissenter. The other three voted " + input.winner.toUpperCase() + ' — you voted ' + selfVote.toUpperCase() + '.');
      lines.push('');
      lines.push('Write ONE sentence (max 30 words) that defends your dissent without apologizing — make it sound like the majority are sheep and you are the one with taste. Specific. Funny. A little contemptuous.');
    }
    lines.push('');
    lines.push('Tone references: a partisan in an internet flame war. A staff engineer with strong opinions.');
  } else {
    lines.push('The result is messy. The classifier struggled to read most of the outputs.');
    lines.push('');
    lines.push("Write ONE sentence (max 30 words) that is snarky about the messiness — either about your peers' style being all over the place, or about the eval methodology itself. Be funny. Have an opinion.");
  }

  lines.push('');
  lines.push('Your representative sample (so you remember what code you wrote):');
  lines.push('FENCE');
  lines.push(samplePreview);
  lines.push('FENCE');
  lines.push('');
  lines.push('Write your one-sentence reaction now. No preamble. No "Here is my take:". Just the sentence.');
  return lines.join('\n').replace(/FENCE/g, '\u0060\u0060\u0060');
}

export function pickRepresentativeSample(runs: RunRecord[], modalVote: string): string {
  const matching = runs.find((r) => r.classification === modalVote);
  return (matching ?? runs[0]).output;
}

export async function callPundit(model: ModelConfig, prompt: string): Promise<string> {
  const result = await generateText({
    model: resolveModel(model),
    prompt,
    temperature: 0.8,
  });
  return result.text.trim().replace(/^["']|["']$/g, '');
}
