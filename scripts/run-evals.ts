#!/usr/bin/env node
// CLI entry point for the eval pipeline.
// Usage: pnpm evals --fight=<slug> [--dry-run] [--runs=10] [--concurrency=4]

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { buildPlan, runFight, explodeCells } from '../src/lib/eval/runner.ts';
import { enabledModels } from '../src/lib/eval/providers/index.ts';
import { aggregate, writeReport } from '../src/lib/eval/report.ts';
import { buildPunditPrompt, callPundit, pickRepresentativeSample } from '../src/lib/eval/pundit.ts';
import type { Fight, RunRecord } from '../src/lib/eval/types.ts';

interface CliArgs {
  fight: string | null;
  dryRun: boolean;
  runs: number;
  concurrency: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { fight: null, dryRun: false, runs: 10, concurrency: 4 };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--fight=')) args.fight = a.slice('--fight='.length);
    else if (a.startsWith('--runs=')) args.runs = Number.parseInt(a.slice('--runs='.length), 10);
    else if (a.startsWith('--concurrency=')) args.concurrency = Number.parseInt(a.slice('--concurrency='.length), 10);
  }
  return args;
}

async function loadFight(slug: string): Promise<Fight> {
  const file = path.resolve(process.cwd(), 'src/content/fights', `${slug}.ts`);
  const mod = await import(pathToFileURL(file).href);
  const fight: Fight = mod.fight ?? mod.default;
  if (!fight) throw new Error(`No fight export found in ${file}`);
  return fight;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.fight) {
    console.error('Usage: pnpm evals --fight=<slug> [--dry-run]');
    process.exit(2);
  }
  const fight = await loadFight(args.fight);
  const temperatures = [0.0, 0.7];
  const models = enabledModels();

  const plan = buildPlan({
    fight,
    models,
    runsPerCell: args.runs,
    temperatures,
    concurrency: args.concurrency,
    dryRun: args.dryRun,
  });

  console.log('Petty Evals — run plan');
  console.log('─'.repeat(60));
  console.log(`Fight:            ${fight.title}`);
  console.log(`Slug:             ${fight.slug}`);
  console.log(`Prompt variants:  ${fight.promptVariants.length}`);
  console.log(`Temperatures:     ${temperatures.join(', ')}`);
  console.log(`Runs per cell:    ${args.runs}`);
  console.log(`Models enabled:   ${models.length}`);
  for (const m of models) console.log(`  - ${m.id} (${m.provider})`);
  console.log('');
  console.log(`Total calls:      ${plan.totalCalls}`);
  console.log(`Estimated cost:   $${plan.estTotalCostUsd.toFixed(2)} USD`);
  console.log('  per model:');
  for (const p of plan.perModel) {
    console.log(`    ${p.id.padEnd(24)} ${p.calls} calls   ~$${p.estCostUsd.toFixed(2)}`);
  }
  console.log('');

  if (args.dryRun) {
    console.log('--dry-run: no API calls made.');
    const cells = explodeCells({
      fight, models, runsPerCell: args.runs, temperatures, concurrency: args.concurrency, dryRun: true,
    });
    console.log(`Would explode to ${cells.length} cell specs.`);
    return;
  }

  const runStartedAt = new Date().toISOString();
  console.log(`Starting at ${runStartedAt}...`);
  const runs = await runFight({
    fight, models, runsPerCell: args.runs, temperatures, concurrency: args.concurrency, dryRun: false,
  });
  const runFinishedAt = new Date().toISOString();
  console.log(`Generations complete (${runs.length} runs). Firing pundits...`);

  // Pundit pass — one call per model.
  const punditQuotes: Record<string, string> = {};
  const voteTally: Record<string, Record<string, number>> = {};
  const representative: Record<string, string> = {};
  for (const m of models) {
    const myRuns = runs.filter((r: RunRecord) => r.modelId === m.id);
    const dist: Record<string, number> = {};
    for (const r of myRuns) dist[r.classification] = (dist[r.classification] ?? 0) + 1;
    voteTally[m.id] = dist;
    const modal = Object.entries(dist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
    representative[m.id] = pickRepresentativeSample(myRuns, modal);
  }
  const prompt = buildPunditPrompt({ fight, voteTally, representativeSamples: representative });
  for (const m of models) {
    try {
      punditQuotes[m.id] = await callPundit(m, prompt);
    } catch (err) {
      punditQuotes[m.id] = '';
      console.error(`Pundit failed for ${m.id}:`, err);
    }
  }

  const result = aggregate(fight, runs, punditQuotes, runStartedAt, runFinishedAt);
  const outDir = path.resolve(process.cwd(), 'src/data/results');
  await mkdir(outDir, { recursive: true });
  const file = await writeReport(result, outDir);
  console.log(`Wrote ${file}`);
  console.log(`Verdict: ${result.verdict.winner} (${JSON.stringify(result.verdict.tally)})`);
  console.log(`Total cost: $${result.totalCostUsd.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
