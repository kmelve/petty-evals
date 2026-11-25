#!/usr/bin/env node
// CLI entry point for the eval pipeline.
//
// Usage:
//   pnpm evals --fight=<slug>                  # full run (10 runs × 3 variants × 2 temps × N models)
//   pnpm evals --fight=all --dry-run           # plan + cost estimate for every fight
//   pnpm evals --fight=<slug> --dry-run        # plan only, no API calls
//   pnpm evals --fight=<slug> --smoke          # 1 run × 1 variant × 1 temp × N models; prints, never writes
//   pnpm evals --fight=<slug> --runs=5 --variants=1 --temps=1
//
// Flags:
//   --runs=N             runs per cell (default 10; --smoke overrides to 1)
//   --variants=N         use only first N prompt variants (default: all)
//   --temps=N            use only first N temperatures (default: all of [0, 0.7])
//   --concurrency=N      parallel calls (default 4)
//   --timeout-ms=N       per-call timeout (default 90000)
//   --retries=N          retry attempts (default 2)
//   --smoke              alias for --runs=1 --variants=1 --temps=1

// Suppress AI SDK warnings about unsupported settings: several reasoning
// models on OpenRouter ignore temperature. The warning is correct but noisy;
// the methodology page documents this explicitly.
(globalThis as Record<string, unknown>).AI_SDK_LOG_WARNINGS = false;

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { buildPlan, runFight, explodeCells } from '../src/lib/eval/runner.ts';
import { enabledModels } from '../src/lib/eval/providers/index.ts';
import { fetchLivePricing, type LivePricing } from '../src/lib/eval/providers/openrouter.ts';
import { aggregate, writeReport } from '../src/lib/eval/report.ts';
import { firePundits } from '../src/lib/eval/pundit.ts';
import type { Fight, ModelConfig } from '../src/lib/eval/types.ts';

interface CliArgs {
  fight: string | null;
  dryRun: boolean;
  smoke: boolean;
  runs: number;
  variants: number | null;
  temps: number | null;
  concurrency: number;
  timeoutMs: number;
  retries: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    fight: null,
    dryRun: false,
    smoke: false,
    runs: 10,
    variants: null,
    temps: null,
    concurrency: 4,
    timeoutMs: 90_000,
    retries: 2,
  };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--smoke') args.smoke = true;
    else if (a.startsWith('--fight=')) args.fight = a.slice('--fight='.length);
    else if (a.startsWith('--runs=')) args.runs = Number.parseInt(a.slice('--runs='.length), 10);
    else if (a.startsWith('--variants=')) args.variants = Number.parseInt(a.slice('--variants='.length), 10);
    else if (a.startsWith('--temps=')) args.temps = Number.parseInt(a.slice('--temps='.length), 10);
    else if (a.startsWith('--concurrency=')) args.concurrency = Number.parseInt(a.slice('--concurrency='.length), 10);
    else if (a.startsWith('--timeout-ms=')) args.timeoutMs = Number.parseInt(a.slice('--timeout-ms='.length), 10);
    else if (a.startsWith('--retries=')) args.retries = Number.parseInt(a.slice('--retries='.length), 10);
  }
  if (args.smoke) {
    args.runs = 1;
    args.variants = 1;
    args.temps = 1;
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

async function listFightSlugs(): Promise<string[]> {
  const dir = path.resolve(process.cwd(), 'src/content/fights');
  return (await readdir(dir)).filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, '')).sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.fight) {
    console.error('Usage: pnpm evals --fight=<slug|all> [--dry-run] [--smoke] [--runs=N] [--variants=N] [--temps=N]');
    process.exit(2);
  }
  const slugs = args.fight === 'all' ? await listFightSlugs() : [args.fight];
  const models = enabledModels();

  let pricing: Record<string, LivePricing> = {};
  try {
    pricing = await fetchLivePricing();
  } catch (err) {
    console.warn(`Could not fetch live OpenRouter pricing, cost estimate will be incomplete: ${(err as Error).message}`);
  }
  for (const m of models) {
    if (Object.keys(pricing).length > 0 && !pricing[m.openrouterId]) {
      console.warn(`WARNING: ${m.openrouterId} is not listed on OpenRouter. Check the id in providers/index.ts.`);
    }
  }

  let estimated = 0;
  let spent = 0;
  const failed: string[] = [];
  for (const slug of slugs) {
    try {
      const outcome = await runOne(slug, args, models, pricing);
      estimated += outcome.estCostUsd;
      spent += outcome.spentUsd;
    } catch (err) {
      // In batch mode one bad fight shouldn't throw away the rest of the run.
      if (slugs.length === 1) throw err;
      failed.push(slug);
      console.error(`FAILED ${slug}: ${(err as Error).message}\n`);
    }
  }
  if (slugs.length > 1) {
    console.log('═'.repeat(60));
    console.log(`${slugs.length} fights. Estimated: $${estimated.toFixed(2)}. Spent on generations: $${spent.toFixed(2)}.`);
    if (failed.length) {
      console.log(`Failed (${failed.length}): ${failed.join(', ')}`);
      process.exitCode = 1;
    }
  }
}

async function runOne(
  slug: string,
  args: CliArgs,
  models: ModelConfig[],
  pricing: Record<string, LivePricing>,
): Promise<{ estCostUsd: number; spentUsd: number }> {
  const fullFight = await loadFight(slug);
  // Apply variant subset
  const fight: Fight = args.variants !== null
    ? { ...fullFight, promptVariants: fullFight.promptVariants.slice(0, args.variants) }
    : fullFight;
  const allTemps = [0.0, 0.7];
  const temperatures = args.temps !== null ? allTemps.slice(0, args.temps) : allTemps;

  const plan = buildPlan({
    fight,
    models,
    runsPerCell: args.runs,
    temperatures,
    concurrency: args.concurrency,
    dryRun: args.dryRun,
  }, pricing);

  console.log('Petty Evals — run plan');
  console.log('─'.repeat(60));
  console.log(`Fight:            ${fight.title}`);
  console.log(`Slug:             ${fight.slug}`);
  console.log(`Prompt variants:  ${fight.promptVariants.length}`);
  console.log(`Temperatures:     ${temperatures.join(', ')}`);
  console.log(`Runs per cell:    ${args.runs}`);
  console.log(`Models enabled:   ${models.length}`);
  for (const m of plan.perModel) {
    const cfg = models.find((c) => c.id === m.id)!;
    const est = m.estCostUsd === null ? 'price unknown' : `~$${m.estCostUsd.toFixed(2)}`;
    console.log(`  - ${cfg.openrouterId.padEnd(34)} ${est}`);
  }
  console.log('');
  console.log(`Total calls:      ${plan.totalCalls}`);
  console.log(`Estimated cost:   $${plan.estTotalCostUsd.toFixed(2)} USD`);
  console.log(`Timeout:          ${args.timeoutMs}ms per call`);
  console.log(`Retries:          ${args.retries}`);
  console.log(`Concurrency:      ${args.concurrency}`);
  console.log('');

  if (args.dryRun) {
    console.log('--dry-run: no API calls made.');
    const cells = explodeCells({
      fight, models, runsPerCell: args.runs, temperatures, concurrency: args.concurrency, dryRun: true,
    });
    console.log(`Would explode to ${cells.length} cell specs.`);
    console.log('');
    return { estCostUsd: plan.estTotalCostUsd, spentUsd: 0 };
  }

  const runStartedAt = new Date().toISOString();
  console.log(`Starting at ${runStartedAt}...`);
  const t0 = Date.now();

  const runs = await runFight({
    fight,
    models,
    runsPerCell: args.runs,
    temperatures,
    concurrency: args.concurrency,
    callTimeoutMs: args.timeoutMs,
    maxRetries: args.retries,
    dryRun: false,
    onProgress: (done, total, record) => {
      const elapsedS = ((Date.now() - t0) / 1000).toFixed(1);
      const status = record.error ? `ERROR: ${record.error.slice(0, 50)}` : `${record.classification} (${record.latencyMs}ms, $${record.costUsd.toFixed(4)})`;
      console.log(`[${done}/${total} @ ${elapsedS}s] ${record.modelId} v${record.variantIndex} t${record.temperature} r${record.runIndex} → ${status}`);
    },
  });

  const runFinishedAt = new Date().toISOString();
  const wallS = ((Date.now() - t0) / 1000).toFixed(1);
  const errorCount = runs.filter(r => r.error).length;
  console.log(`\nGenerations complete: ${runs.length} runs in ${wallS}s (${errorCount} errors).`);

  // Save raw runs to disk before pundit pass — protects against partial failure
  const tmpDir = path.resolve(process.cwd(), 'src/data/results/.tmp');
  await mkdir(tmpDir, { recursive: true });
  await writeFile(
    path.join(tmpDir, `${fight.slug}-raw-runs.json`),
    JSON.stringify(runs, null, 2),
  );
  console.log(`Saved raw runs to ${path.join(tmpDir, fight.slug + '-raw-runs.json')}`);

  const spentUsd = runs.reduce((sum, r) => sum + r.costUsd, 0);
  // Don't overwrite a good result file with a run that mostly failed (bad key, outage, wrong model id).
  if (errorCount > runs.length / 2) {
    const sample = runs.find((r) => r.error)?.error ?? '';
    throw new Error(`${errorCount}/${runs.length} calls failed for ${fight.slug}; not writing results. First error: ${sample}`);
  }
  for (const m of models) {
    const failed = runs.filter((r) => r.modelId === m.id && r.error).length;
    if (failed > 0) console.warn(`  ${m.id}: ${failed} failed calls`);
  }

  console.log('Firing pundits...');
  const result = aggregate(fight, runs, models, runStartedAt, runFinishedAt);

  await firePundits(fight, result, (modelId, outcome) => {
    if ('quote' in outcome) console.log(`Pundit ${modelId}: ${outcome.quote}`);
    else if ('error' in outcome) console.error(`Pundit failed for ${modelId}:`, outcome.error);
    else console.warn(`Pundit skipped for ${modelId}: ${outcome.skipped}`);
  });

  if (args.smoke) {
    // A smoke run is one sample per model; never let it replace a real result file.
    console.log('\n--smoke: result not written.');
  } else {
    const outDir = path.resolve(process.cwd(), 'src/data/results');
    await mkdir(outDir, { recursive: true });
    const file = await writeReport(result, outDir);
    console.log(`\nWrote ${file}`);
  }
  console.log(`Verdict: ${result.verdict.winner} (${JSON.stringify(result.verdict.tally)})`);
  console.log(`Disagreement Index: ${result.verdict.disagreementIndex.toFixed(3)}`);
  console.log(`Total cost: $${result.totalCostUsd.toFixed(4)}`);
  console.log(`Wall-clock: ${wallS}s`);
  console.log('');
  return { estCostUsd: plan.estTotalCostUsd, spentUsd };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
