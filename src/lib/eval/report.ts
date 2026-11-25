// Aggregate raw run records into the FightResult JSON consumed by the site,
// and derive the pundit panel from a result.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Fight, FightResult, ModelConfig, ModelResult, RunRecord } from './types.ts';
import { wilsonInterval, shannonEntropy } from './stats.ts';
import { findModel } from './providers/index.ts';
import type { PanelMember } from './pundit.ts';

/** Most frequent label. Ties resolve to the first label seen. */
export function modalVote(dist: Record<string, number>): string {
  let best = 'unknown';
  let bestN = -1;
  for (const [k, v] of Object.entries(dist)) {
    if (v > bestN) {
      best = k;
      bestN = v;
    }
  }
  return best;
}

/**
 * Recompute vote, distribution and confidence for one model from its runs.
 *
 * 'unknown' means the classifier abstained (e.g. the code never contained an
 * array literal), so it is not a vote. The model's vote is its most common
 * readable label, and confidence is measured over readable runs only. A model
 * only votes 'unknown' when none of its runs were readable. The full
 * distribution, abstentions included, stays in voteDistribution.
 */
export function summarizeRuns(runs: RunRecord[]): Pick<ModelResult, 'vote' | 'voteDistribution' | 'confidence' | 'confidenceCI95'> {
  const dist: Record<string, number> = {};
  for (const r of runs) dist[r.classification] = (dist[r.classification] ?? 0) + 1;
  const readable = Object.fromEntries(Object.entries(dist).filter(([label]) => label !== 'unknown'));
  const vote = modalVote(readable);
  const successes = vote === 'unknown' ? (dist.unknown ?? 0) : dist[vote];
  const total = vote === 'unknown' ? runs.length : runs.length - (dist.unknown ?? 0);
  return {
    vote,
    voteDistribution: dist,
    confidence: total === 0 ? 0 : successes / total,
    confidenceCI95: wilsonInterval(successes, total),
  };
}

/** Verdict across models: tally of each model's modal vote. */
export function computeVerdict(models: Array<Pick<ModelResult, 'vote'>>): FightResult['verdict'] {
  const tally: Record<string, number> = {};
  for (const m of models) tally[m.vote] = (tally[m.vote] ?? 0) + 1;
  return {
    winner: modalVote(tally),
    tally,
    disagreementIndex: shannonEntropy(Object.values(tally)),
  };
}

export function aggregate(
  fight: Fight,
  runs: RunRecord[],
  models: ModelConfig[],
  runStartedAt: string,
  runFinishedAt: string,
): FightResult {
  const modelResults: ModelResult[] = models.map((m) => {
    const myRuns = runs.filter((r) => r.modelId === m.id);
    return {
      id: m.id,
      displayName: m.displayName,
      provider: m.lab,
      shortName: m.shortName,
      openrouterId: m.openrouterId,
      openWeights: m.openWeights,
      ...summarizeRuns(myRuns),
      punditQuote: null,
      runs: myRuns,
    };
  });

  return {
    slug: fight.slug,
    runStartedAt,
    runFinishedAt,
    totalCostUsd: runs.reduce((s, r) => s + r.costUsd, 0),
    totalRuns: runs.length,
    models: modelResults,
    verdict: computeVerdict(modelResults),
    classifierKappa: null,
  };
}

/** Build the pundit panel from a result. Falls back to the roster for results written before shortName existed. */
export function panelFromResult(result: FightResult): PanelMember[] {
  return result.models.map((m) => {
    const config = findModel(m.id);
    return {
      id: m.id,
      name: m.shortName ?? config?.shortName ?? m.displayName,
      lab: config?.lab ?? m.provider,
      openWeights: m.openWeights ?? config?.openWeights ?? false,
      vote: m.vote,
      voteDistribution: m.voteDistribution,
    };
  });
}

export async function writeReport(result: FightResult, outDir: string): Promise<string> {
  const file = path.join(outDir, `${result.slug}.json`);
  await writeFile(file, JSON.stringify(result, null, 2) + '\n', 'utf8');
  return file;
}
