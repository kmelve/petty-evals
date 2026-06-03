// Aggregate raw run records into the FightResult JSON consumed by the site.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Fight, FightResult, ModelResult, RunRecord } from './types.ts';
import { wilsonInterval, shannonEntropy } from './stats.ts';
import { enabledModels } from './providers/index.ts';

function modalVote(dist: Record<string, number>): string {
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

export function aggregate(
  fight: Fight,
  runs: RunRecord[],
  punditQuotes: Record<string, string>,
  runStartedAt: string,
  runFinishedAt: string,
): FightResult {
  const models = enabledModels();
  const modelResults: ModelResult[] = models.map((m) => {
    const myRuns = runs.filter((r) => r.modelId === m.id);
    const dist: Record<string, number> = {};
    for (const r of myRuns) dist[r.classification] = (dist[r.classification] ?? 0) + 1;
    const vote = modalVote(dist);
    const successes = dist[vote] ?? 0;
    const total = myRuns.length;
    const [lo, hi] = wilsonInterval(successes, total);
    return {
      id: m.id,
      displayName: m.displayName,
      provider: m.provider,
      vote,
      voteDistribution: dist,
      confidence: total === 0 ? 0 : successes / total,
      confidenceCI95: [lo, hi],
      punditQuote: punditQuotes[m.id] ?? null,
      runs: myRuns,
    };
  });

  // Verdict: tally of per-model modal votes.
  const tally: Record<string, number> = {};
  for (const m of modelResults) tally[m.vote] = (tally[m.vote] ?? 0) + 1;
  const tallyVec = Object.values(tally);
  const disagreementIndex = shannonEntropy(tallyVec);
  const winner = modalVote(tally);

  return {
    slug: fight.slug,
    runStartedAt,
    runFinishedAt,
    totalCostUsd: runs.reduce((s, r) => s + r.costUsd, 0),
    totalRuns: runs.length,
    models: modelResults,
    verdict: { winner, tally, disagreementIndex },
    classifierKappa: null,
  };
}

export async function writeReport(result: FightResult, outDir: string): Promise<string> {
  const file = path.join(outDir, `${result.slug}.json`);
  await writeFile(file, JSON.stringify(result, null, 2) + '\n', 'utf8');
  return file;
}
