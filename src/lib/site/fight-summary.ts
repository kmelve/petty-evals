// Display logic shared by the homepage, fight pages and OG cards.
// Pure functions over a FightResult so every surface tells the same story.

import { classifyMode, type VerdictMode } from '../eval/pundit.ts';

export interface SummaryModel {
  id: string;
  displayName: string;
  shortName?: string;
  vote: string;
  punditQuote: string | null;
}

export interface SummaryInput {
  slug?: string;
  verdict: { winner: string; tally: Record<string, number> };
  models: SummaryModel[];
}

export interface Segment {
  modelId: string;
  name: string;
  vote: string;
  /** 0 = winning label, 1 = runner-up, ... Used to pick a color. */
  rank: number;
}

export interface FightSummary {
  mode: VerdictMode;
  winner: string;
  panelSize: number;
  /** Labels ordered by votes, highest first. */
  labels: Array<{ label: string; count: number }>;
  /** Short scoreline like "7–1" or "4–3–1". */
  score: string;
  /** One-line kicker for cards and share images. */
  headline: string;
  segments: Segment[];
  /** The spiciest pundit line: a dissenter's if there is one, otherwise the shortest. */
  featuredQuote: { modelId: string; name: string; text: string } | null;
}

export function modelName(m: Pick<SummaryModel, 'shortName' | 'displayName'>): string {
  return m.shortName ?? m.displayName;
}

/** Labels are slugs like `no-trailing` or `snake_case`; make them readable. */
export function prettyLabel(label: string): string {
  return label === 'unknown' ? 'unreadable' : label.replace(/-/g, ' ');
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

const UNANIMOUS_LINES = [
  (n: string) => `${capitalize(n)} for ${n}. Nobody even pretended to consider the alternative.`,
  (n: string) => `Unanimous. ${capitalize(n)} models, zero votes for the other side.`,
  (n: string) => `All ${n} agree, which never happens in the replies.`,
  (n: string) => `${capitalize(n)} models, one opinion. The other camp did not get a single vote.`,
];

/** Stable small hash so a fight always gets the same rotating line. */
function pickIndex(seed: string, size: number): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % size;
}

function buildHeadline(mode: VerdictMode, labels: FightSummary['labels'], panelSize: number, seed: string): string {
  const win = prettyLabel(labels[0]?.label ?? 'unknown');
  const runnerUp = labels[1]?.label;
  const loser = runnerUp ? prettyLabel(runnerUp) : null;
  switch (mode) {
    case 'unanimous':
      return UNANIMOUS_LINES[pickIndex(seed, UNANIMOUS_LINES.length)](numberWord(panelSize));
    case 'lone-dissent':
      return runnerUp === 'unknown'
        ? `${capitalize(win)} wins. One model produced something the classifier couldn't read, which is its own kind of answer.`
        : `${capitalize(win)} wins. One model voted ${loser} and is now dead to the others.`;
    case 'majority':
      return `${capitalize(win)} takes it, but ${numberWord(panelSize - labels[0].count)} holdouts refuse to concede.`;
    case 'tied':
      return runnerUp === 'unknown' || labels[0]?.label === 'unknown'
        ? `Half the panel picked ${prettyLabel(labels.find((l) => l.label !== 'unknown')?.label ?? 'unknown')}. The other half wrote something nobody could classify.`
        : `Dead heat between ${win} and ${loser}. The group chat is not okay.`;
    case 'unclear':
      return 'The classifier gave up. Honestly, same.';
  }
}

/** Capitalize the first letter unless the label is a tool name that is lowercase by convention. */
function capitalize(s: string): string {
  if (/^(pnpm|npm|yarn|bun|fstring|snake_case|camelCase)\b/.test(s)) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function summarize(result: SummaryInput): FightSummary {
  const labels = Object.entries(result.verdict.tally)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || (a.label === 'unknown' ? 1 : 0) - (b.label === 'unknown' ? 1 : 0));
  const rankOf = new Map(labels.map((l, i) => [l.label, i]));
  const mode = classifyMode(Object.fromEntries(result.models.map((m) => [m.id, m.vote])));
  const panelSize = result.models.length;

  const segments = result.models
    .map((m) => ({ modelId: m.id, name: modelName(m), vote: m.vote, rank: rankOf.get(m.vote) ?? labels.length }))
    .sort((a, b) => a.rank - b.rank);

  return {
    mode,
    winner: result.verdict.winner,
    panelSize,
    labels,
    score: labels.length === 1 ? `${labels[0].count}–0` : labels.map((l) => l.count).join('–'),
    headline: buildHeadline(mode, labels, panelSize, result.slug ?? ''),
    segments,
    featuredQuote: pickFeaturedQuote(result.models, result.verdict.winner, mode),
  };
}

function pickFeaturedQuote(models: SummaryModel[], winner: string, mode: VerdictMode): FightSummary['featuredQuote'] {
  const withQuotes = models.filter((m) => m.punditQuote && m.punditQuote.trim().length > 0);
  if (withQuotes.length === 0) return null;
  const dissenters = mode === 'unanimous' ? [] : withQuotes.filter((m) => m.vote !== winner && m.vote !== 'unknown');
  const pool = dissenters.length > 0 ? dissenters : withQuotes;
  const pick = [...pool].sort((a, b) => a.punditQuote!.length - b.punditQuote!.length)[0];
  return { modelId: pick.id, name: modelName(pick), text: pick.punditQuote! };
}
