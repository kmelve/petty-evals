#!/usr/bin/env node
// Reclassify existing result JSON files using current classifier.
// Recomputes vote/voteDistribution/confidence per model + verdict + disagreement.

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { classifyOutput } from '../src/lib/eval/classifiers/index.ts';
import { summarizeRuns, computeVerdict } from '../src/lib/eval/report.ts';
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
    newModels.push({ ...m, ...summarizeRuns(newRuns), runs: newRuns });
  }

  const verdict = computeVerdict(newModels);

  const result: FightResult = {
    ...raw,
    models: newModels,
    verdict,
  };
  await writeFile(jsonPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`Reclassified ${raw.slug}: verdict=${verdict.winner} tally=${JSON.stringify(verdict.tally)} disagreement=${verdict.disagreementIndex.toFixed(3)}`);
}

const slugs = process.argv.slice(2);
for (const slug of slugs) {
  await reclassifyFile(path.resolve(process.cwd(), 'src/data/results', `${slug}.json`));
}
