// Pundit prompt — fired ONCE per model per fight, after all runs complete.
// Voice: judgy, snarky, model-by-model. NOT analyst-speak.
// Works for any panel size; the prompt names the panel size and who sided with whom.

import { generateText } from 'ai';
import type { Fight, FightResult, ModelConfig, RunRecord } from './types.ts';
import { resolveModel } from './providers/openrouter.ts';
import { findModel } from './providers/index.ts';
import { panelFromResult } from './report.ts';

export type VerdictMode = 'unanimous' | 'lone-dissent' | 'majority' | 'tied' | 'unclear';

export interface PanelMember {
  id: string;
  /** Name other pundits use for this model ("Kimi", "GPT"). */
  name: string;
  lab: string;
  openWeights: boolean;
  vote: string;
  voteDistribution: Record<string, number>;
}

export interface PunditInput {
  fight: Fight;
  panel: PanelMember[];
  selfId: string;
  winner: string;
  mode: VerdictMode;
  representativeSample: string;
}

/** Count modal votes per label, highest first. */
export function tallyVotes(votes: string[]): Array<[string, number]> {
  const counts: Record<string, number> = {};
  for (const v of votes) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function classifyMode(modelVotes: Record<string, string>): VerdictMode {
  const votes = Object.values(modelVotes);
  const ranked = tallyVotes(votes);
  if (ranked.length === 0) return 'unclear';
  const [topLabel, topCount] = ranked[0];
  const secondCount = ranked[1]?.[1] ?? 0;
  if (topCount === secondCount) return 'tied';
  if (topLabel === 'unknown') return 'unclear';
  if (topCount === votes.length) return 'unanimous';
  if (topCount === votes.length - 1) return 'lone-dissent';
  return 'majority';
}

function describeMember(m: PanelMember): string {
  const weights = m.openWeights ? 'open weights' : 'closed';
  const dist = Object.entries(m.voteDistribution)
    .filter(([k]) => k !== 'unknown')
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  // Abstentions are runs where the code never touched the contested choice. Not a vote, not dunk material.
  const abstained = m.voteDistribution.unknown ? `; ${m.voteDistribution.unknown} runs didn't touch the question` : '';
  const vote = m.vote === 'unknown' ? 'NOTHING CLASSIFIABLE' : m.vote.toUpperCase();
  return `  - ${m.name} (${m.lab}, ${weights}) voted ${vote} (${dist || 'no readable runs'}${abstained})`;
}

function namesList(members: PanelMember[]): string {
  const names = members.map((m) => m.name);
  if (names.length <= 1) return names.join('');
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

export function buildPunditPrompt(input: PunditInput): string {
  const self = input.panel.find((m) => m.id === input.selfId);
  if (!self) throw new Error(`Pundit ${input.selfId} is not on the panel`);
  const n = input.panel.length;
  const peers = input.panel.filter((m) => m.id !== self.id);
  const allies = peers.filter((m) => m.vote === self.vote);
  const opponents = peers.filter((m) => m.vote !== self.vote);
  const winnerCount = input.panel.filter((m) => m.vote === input.winner).length;

  const lines: string[] = [];
  lines.push(`You are ${self.name}, made by ${self.lab}. You are one of ${n} AI models on a panel settling a petty coding-style fight.`);
  lines.push('');
  lines.push(`The question: ${input.fight.question}`);
  lines.push('');
  lines.push(`Across all your runs, you mostly voted: ${self.vote.toUpperCase()}`);
  lines.push('');
  lines.push("Here's how the rest of the panel voted:");
  lines.push(peers.map(describeMember).join('\n'));
  lines.push('');

  if (input.mode === 'unanimous') {
    lines.push(`All ${n} of you agreed on ${input.winner.toUpperCase()}. There is nobody on this panel to dunk on, but plenty of developers in the wild still get this wrong.`);
    lines.push('');
    lines.push('Write ONE sentence (max 30 words) that is smug, certain, and a little mean about anyone who picks the other option. Be specific about WHY the winner is correct. No hedging. No "it depends." This is a roast.');
    lines.push('');
    lines.push('Tone references: a senior dev who has run out of patience. Funny, but cutting.');
    lines.push('');
    lines.push('Examples of the tonal target (NOT for this question):');
    lines.push(`  - "If you are still using var in 2026, I have questions about your life choices."`);
    lines.push(`  - "Tabs people. We are ${n} for ${n}. Touch grass."`);
  } else if (input.mode === 'lone-dissent' && self.vote !== input.winner) {
    lines.push(`You are the lone dissenter. The other ${n - 1} voted ${input.winner.toUpperCase()}; you voted ${self.vote.toUpperCase()}.`);
    lines.push('');
    lines.push('Write ONE sentence (max 30 words) that defends your dissent without apologizing. The majority are sheep and you are the one with taste. Name at least one of them. Specific. Funny. A little contemptuous.');
  } else if (input.mode === 'lone-dissent' || input.mode === 'majority') {
    if (self.vote === input.winner) {
      lines.push(`${winnerCount} of ${n} voted ${input.winner.toUpperCase()}, you among them. The holdouts: ${namesList(opponents)}.`);
      lines.push('');
      lines.push('Write ONE sentence (max 30 words) that is smug about being on the right side AND dunks on a holdout BY NAME. Specific about why they are wrong. Funny, mean, confident.');
    } else {
      lines.push(`You lost. ${winnerCount} of ${n} voted ${input.winner.toUpperCase()}; you voted ${self.vote.toUpperCase()}${allies.length ? ` alongside ${namesList(allies)}` : ''}.`);
      lines.push('');
      lines.push('Write ONE sentence (max 30 words) that refuses to concede and dunks on a model from the winning side BY NAME. Specific. Funny. A little contemptuous.');
    }
  } else if (input.mode === 'tied') {
    lines.push('The panel is split down the middle. Nobody won.');
    if (allies.length) lines.push(`On your side: ${namesList(allies)}.`);
    lines.push(`Against you: ${namesList(opponents)}.`);
    lines.push('');
    lines.push('Write ONE sentence (max 30 words) that defends YOUR vote and dunks on a model that disagreed, BY NAME. Be specific about why they are wrong. Be a little mean. Be funny.');
  } else {
    lines.push('The result is a mess. The classifier could not read most of the outputs.');
    lines.push('');
    lines.push("Write ONE sentence (max 30 words) that is snarky about the mess: your peers' style being all over the place, or the eval methodology itself. Have an opinion.");
  }

  if (input.mode !== 'unanimous' && input.mode !== 'unclear') {
    lines.push('');
    lines.push('Tone references: a partisan in an internet flame war who knows they are right. A staff engineer with zero patience. Lab rivalries and open-vs-closed weights are fair game; personal insults about real people are not.');
  }

  lines.push('');
  lines.push('Your representative sample (so you remember what code you wrote):');
  lines.push('```');
  lines.push(input.representativeSample.slice(0, 400));
  lines.push('```');
  lines.push('');
  lines.push('Write your one-sentence reaction now. No preamble. No "Here is my take:". Just the sentence.');
  return lines.join('\n');
}

export function pickRepresentativeSample(runs: RunRecord[], modalVote: string): string {
  const matching = runs.find((r) => r.classification === modalVote);
  return (matching ?? runs[0])?.output ?? '';
}

/** Strip a matching pair of wrapping quotes, never a quote that closes a quotation inside the sentence. */
export function cleanQuote(text: string): string {
  const t = text.trim();
  const wrapped = /^["“]/.test(t) && /["”]$/.test(t) && (t.match(/["“”]/g) ?? []).length === 2;
  return (wrapped ? t.slice(1, -1) : t).trim();
}

export async function callPundit(model: ModelConfig, prompt: string): Promise<string> {
  const result = await generateText({
    model: resolveModel(model),
    prompt,
    temperature: 0.8,
  });
  return cleanQuote(result.text);
}

/**
 * Ask every model on the panel for its one-liner and write it onto the result.
 * A failed pundit leaves that model's quote untouched and is reported via onEvent.
 */
export async function firePundits(
  fight: Fight,
  result: FightResult,
  onEvent: (modelId: string, outcome: { quote: string } | { error: unknown } | { skipped: string }) => void = () => {},
): Promise<void> {
  const panel = panelFromResult(result);
  const mode = classifyMode(Object.fromEntries(panel.map((m) => [m.id, m.vote])));
  for (const m of result.models) {
    const config = findModel(m.id);
    if (!config) {
      onEvent(m.id, { skipped: 'not in roster' });
      continue;
    }
    const prompt = buildPunditPrompt({
      fight,
      panel,
      selfId: m.id,
      winner: result.verdict.winner,
      mode,
      representativeSample: pickRepresentativeSample(m.runs, m.vote),
    });
    try {
      m.punditQuote = await withPatience(() => callPundit(config, prompt));
      onEvent(m.id, { quote: m.punditQuote });
    } catch (error) {
      onEvent(m.id, { error });
    }
  }
}

/**
 * Upstream rate limits (seen on GPT via OpenRouter) outlast the SDK's quick
 * retries. Wait it out a few times before giving up on a pundit, and treat an
 * empty reply as a failure.
 */
export async function withPatience<T>(fn: () => Promise<T>, delaysMs = [10_000, 30_000, 60_000], sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      const value = await fn();
      if (typeof value === 'string' && value.trim() === '') throw new Error('Empty pundit reply');
      return value;
    } catch (error) {
      lastError = error;
      if (attempt < delaysMs.length) await sleep(delaysMs[attempt]);
    }
  }
  throw lastError;
}
