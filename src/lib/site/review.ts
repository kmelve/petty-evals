// The code-review conceit: each fight is a pull request, each model a reviewer.
// Maps verdicts and votes to review vocabulary and to the vote colors.

import type { VerdictMode } from '../eval/pundit.ts';

/** Solid backgrounds by vote rank: winning side, runner-up, third, everything else. */
export const RANK_BG = ['bg-emerald-500', 'bg-amber-400', 'bg-rose-500', 'bg-zinc-400'] as const;
/** Text colors that pair with RANK_BG for labels on white. */
export const RANK_TEXT = ['text-emerald-700', 'text-amber-700', 'text-rose-700', 'text-zinc-600'] as const;

export function rankBg(rank: number): string {
  return RANK_BG[Math.min(rank, RANK_BG.length - 1)];
}

export function rankText(rank: number): string {
  return RANK_TEXT[Math.min(rank, RANK_TEXT.length - 1)];
}

export interface PrStatus {
  label: string;
  /** Pill classes: background, text and ring. */
  tone: string;
}

export function prStatus(mode: VerdictMode): PrStatus {
  switch (mode) {
    case 'unanimous':
      return { label: 'Approved', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
    case 'lone-dissent':
      return { label: 'Approved (one holdout)', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
    case 'majority':
      return { label: 'Changes requested', tone: 'bg-amber-50 text-amber-800 ring-amber-600/25' };
    case 'tied':
      return { label: 'Merge conflict', tone: 'bg-rose-50 text-rose-700 ring-rose-600/20' };
    case 'unclear':
      return { label: "Can't reproduce", tone: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20' };
  }
}

export type ReviewState = 'approved' | 'changes-requested' | 'commented';

/** How one reviewer "reviewed": sided with the winner, fought it, or produced nothing classifiable. */
export function reviewState(vote: string, winner: string): ReviewState {
  if (vote === 'unknown') return 'commented';
  return vote === winner ? 'approved' : 'changes-requested';
}

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  approved: 'approved',
  'changes-requested': 'requested changes',
  commented: 'commented',
};

/** Two-letter avatar initials from a short name ("GPT" -> "GP", "DeepSeek" -> "DS"). */
export function initials(name: string): string {
  const caps = name.match(/[A-Z]/g) ?? [];
  if (caps.length >= 2 && caps.length <= 3) return caps.slice(0, 2).join('');
  return name.slice(0, 2);
}
