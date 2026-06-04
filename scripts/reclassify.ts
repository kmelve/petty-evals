#!/usr/bin/env node
// Reclassify existing result JSON files using current classifier.
// Recomputes vote/voteDistribution/confidence per model + verdict + disagreement.

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { classifyOutput } from '../src/lib/eval/classifiers/index.ts';
import { wilsonInterval, shannonEntropy } from '../src/lib/eval/stats.ts';
import type { Fight, FightResult, RunRecord, ModelResult } from '../src/lib/eval/types.ts';

async function loadFight(slug: string): Promise<Fight> {
  const file = path.resolve(process.cwd(), 'src/content/fights', `${slug}.ts`);
  const mod = await import(pathToFileURL(file).href);
  return mod.fight ?? mod.default;
}

async function reclassifyFile(jsonPath: string): Promise<void> {
  const raw = JSON.parse(await readFile(jsonPath, 'utf8')) as FightResult;
  const fight = await loadFight(raw.slug);

  const newModels: ModelResult[] = [];
  for (const m of raw.models) {
    const newRuns: RunRecord[] = [];
    for (const r of m.runs) {
      const newLabel = r.output ? await classifyOutput(fight, r.output) : 'unknown';
      newRuns.push({ ...r, classification: newLabel });
    }
    const dist: Record<string, number> = {};
    for (const r of newRuns) dist[r.classification] = (dist[r.classification] ?? 0) + 1;
    const modalEntry = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
    const vote = modalEntry?.[0] ?? 'unknown';
    const successes = dist[vote] ?? 0;
    const total = newRuns.length;
    const confidence = total > 0 ? successes / total : 0;
    const ci = total > 0 ? wilsonInterval(successes, total) : [0, 0] as [number, number];
    newModels.push({
      ...m,
      vote,
      voteDistribution: dist,
      confidence,
      confidenceCI95: ci,
      runs: newRuns,
    });
  }

  const tally: Record<string, number> = {};
  for (const m of newModels) tally[m.vote] = (tally[m.vote] ?? 0) + 1;
  const winnerEntry = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  const winner = winnerEntry?.[0] ?? 'unknown';
  const counts = Object.values(tally);
  const disagreementIndex = shannonEntropy(counts);

  const result: FightResult = {
    ...raw,
    models: newModels,
    verdict: { winner, tally, disagreementIndex },
  };
  await writeFile(jsonPath, JSON.stringify(result, null, 2));
  console.log(`Reclassified ${raw.slug}: verdict=${winner} tally=${JSON.stringify(tally)} disagreement=${disagreementIndex.toFixed(3)}`);
}

const slugs = process.argv.slice(2);
for (const slug of slugs) {
  await reclassifyFile(path.resolve(process.cwd(), 'src/data/results', `${slug}.json`));
}
