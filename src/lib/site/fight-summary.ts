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
  /** The fight's pickable answers, for display names ("===" instead of "triple equals") and the losing side of a unanimous vote. */
  sides?: Array<{ label: string; name: string }>;
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
  /** Display name of the winning label. */
  winnerName: string;
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

// Unanimous results are funniest when they talk to whoever picked the other side.
const UNANIMOUS_LINES = [
  (n: number, loser: string) => `${n}–0. If you write ${loser}, every model on the panel thinks you're wrong.`,
  (n: number, loser: string) => `Zero votes for ${loser}. Not one model out of ${numberWord(n)}.`,
  (n: number, loser: string) => `All ${numberWord(n)} agree. If you picked ${loser}, consider this an intervention.`,
  (n: number, loser: string) => `${capitalize(numberWord(n))} models, one opinion. ${capitalize(loser)} people, we need to talk.`,
];

/** Stable small hash so a fight always gets the same rotating line. */
function pickIndex(seed: string, size: number): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % size;
}

interface HeadlineInput {
  mode: VerdictMode;
  labels: FightSummary['labels'];
  panelSize: number;
  seed: string;
  name: (label: string) => string;
  /** The side nobody (or the fewest) picked, by label, for unanimous lines. */
  loserLabel: string | null;
  dissenter: string | null;
  score: string;
}

function buildHeadline(h: HeadlineInput): string {
  const { mode, labels, panelSize, name, score } = h;
  const winLabel = labels[0]?.label ?? 'unknown';
  const win = name(winLabel);
  const runnerUp = labels[1]?.label;
  switch (mode) {
    case 'unanimous':
      return UNANIMOUS_LINES[pickIndex(h.seed, UNANIMOUS_LINES.length)](panelSize, h.loserLabel ? name(h.loserLabel) : 'the other side');
    case 'lone-dissent':
      return runnerUp === 'unknown' || !h.dissenter
        ? `${capitalize(win)} wins. One model produced something the classifier couldn't read, which is its own kind of answer.`
        : `${capitalize(win)} wins ${score}. ${h.dissenter} voted ${name(runnerUp!)} and hasn't been invited to standup since.`;
    case 'majority':
      return `${capitalize(win)} wins ${score}. The ${numberWord(panelSize - labels[0].count)} holdouts are writing a blog post about it.`;
    case 'tied':
      return runnerUp === 'unknown' || winLabel === 'unknown'
        ? `Half the panel picked ${name(labels.find((l) => l.label !== 'unknown')?.label ?? 'unknown')}. The other half wrote something nobody could classify.`
        : `${capitalize(win)} vs. ${name(runnerUp!)}, ${score}. Just like your team.`;
    case 'unclear':
      return "The classifier couldn't make sense of it. Neither could I.";
  }
}

/** Capitalize the first letter unless the text is code or a tool name that is lowercase by convention. */
function capitalize(s: string): string {
  if (/^(pnpm|npm|yarn|bun|fstring|snake_case|camelCase|interface|type|const|let)\b/.test(s) || /^[^A-Za-z]/.test(s)) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function summarize(result: SummaryInput): FightSummary {
  const labels = Object.entries(result.verdict.tally)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || (a.label === 'unknown' ? 1 : 0) - (b.label === 'unknown' ? 1 : 0));
  const rankOf = new Map(labels.map((l, i) => [l.label, i]));
  const mode = classifyMode(Object.fromEntries(result.models.map((m) => [m.id, m.vote])));
  const panelSize = result.models.length;

  const name = (label: string) => result.sides?.find((s) => s.label === label)?.name ?? prettyLabel(label);
  const score = labels.length === 1 ? `${labels[0].count}–0` : labels.map((l) => l.count).join('–');
  const winner = result.verdict.winner;
  const loserLabel = result.sides?.find((s) => s.label !== winner)?.label ?? (labels[1]?.label !== 'unknown' ? labels[1]?.label ?? null : null);
  const dissenterModel = mode === 'lone-dissent' ? result.models.find((m) => m.vote !== winner && m.vote !== 'unknown') : undefined;

  const segments = result.models
    .map((m) => ({ modelId: m.id, name: modelName(m), vote: m.vote, rank: rankOf.get(m.vote) ?? labels.length }))
    .sort((a, b) => a.rank - b.rank);

  return {
    mode,
    winner,
    winnerName: name(winner),
    panelSize,
    labels,
    score,
    headline: buildHeadline({ mode, labels, panelSize, seed: result.slug ?? '', name, loserLabel, dissenter: dissenterModel ? modelName(dissenterModel) : null, score }),
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
