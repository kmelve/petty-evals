// Run orchestrator. For each enabled model, for each prompt variant,
// for each temperature in {0.0, 0.7}, fire N runs and classify the output.
//
// API calls are gated behind `opts.dryRun` — when true, the runner returns
// the run *plan* and an estimated cost based on hand-tuned token counts.

import pLimit from 'p-limit';
import { generateText } from 'ai';
import type { Fight, ModelConfig, RunRecord } from './types.ts';
import { resolveModel, computeCostUsd, enabledModels } from './providers/index.ts';
import { classifyOutput } from './classifiers/index.ts';

export interface RunOptions {
  fight: Fight;
  models?: ModelConfig[];
  runsPerCell: number; // N
  temperatures: number[]; // e.g. [0, 0.7]
  concurrency: number;
  dryRun: boolean;
  /** Per-call timeout in ms. Default 90s — providers occasionally hang on cold paths. */
  callTimeoutMs?: number;
  /** Retry attempts on transient failure / timeout. Default 2 (so 3 tries total). */
  maxRetries?: number;
  /** Progress callback fired after each cell completes (success or terminal failure). */
  onProgress?: (done: number, total: number, record: RunRecord) => void;
}

export interface RunPlan {
  fightSlug: string;
  totalCalls: number;
  perModel: Array<{ id: string; calls: number; estCostUsd: number }>;
  estTotalCostUsd: number;
}

// Token estimates for cost projection — deliberately conservative.
const EST_INPUT_TOKENS = 80;
const EST_OUTPUT_TOKENS = 350;

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_RETRIES = 2;

export function buildPlan(opts: RunOptions): RunPlan {
  const models = opts.models ?? enabledModels();
  const callsPerModel = opts.fight.promptVariants.length * opts.temperatures.length * opts.runsPerCell;
  const perModel = models.map((m) => ({
    id: m.id,
    calls: callsPerModel,
    estCostUsd: callsPerModel * computeCostUsd(m.pricing, EST_INPUT_TOKENS, EST_OUTPUT_TOKENS),
  }));
  return {
    fightSlug: opts.fight.slug,
    totalCalls: callsPerModel * models.length,
    perModel,
    estTotalCostUsd: perModel.reduce((s, m) => s + m.estCostUsd, 0),
  };
}

export interface CellSpec {
  model: ModelConfig;
  variantIndex: number;
  variantPrompt: string;
  temperature: number;
  runIndex: number;
}

export function explodeCells(opts: RunOptions): CellSpec[] {
  const models = opts.models ?? enabledModels();
  const cells: CellSpec[] = [];
  for (const model of models) {
    for (let v = 0; v < opts.fight.promptVariants.length; v++) {
      for (const t of opts.temperatures) {
        for (let r = 0; r < opts.runsPerCell; r++) {
          cells.push({
            model,
            variantIndex: v,
            variantPrompt: opts.fight.promptVariants[v],
            temperature: t,
            runIndex: r,
          });
        }
      }
    }
  }
  return cells;
}

async function attemptCall(
  fight: Fight,
  cell: CellSpec,
  timeoutMs: number,
  useFallback: boolean,
): Promise<RunRecord> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  const t0 = Date.now();
  try {
    const result = await generateText({
      model: resolveModel(cell.model, useFallback),
      prompt: cell.variantPrompt,
      temperature: cell.temperature,
      abortSignal: controller.signal,
    });
    const inputTokens = result.usage?.inputTokens ?? 0;
    const outputTokens = result.usage?.outputTokens ?? 0;
    const classification = await classifyOutput(fight, result.text);
    return {
      modelId: cell.model.id,
      variantIndex: cell.variantIndex,
      temperature: cell.temperature,
      runIndex: cell.runIndex,
      prompt: cell.variantPrompt,
      output: result.text,
      classification,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - t0,
      costUsd: computeCostUsd(cell.model.pricing, inputTokens, outputTokens),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function executeCell(opts: {
  fight: Fight;
  cell: CellSpec;
  timeoutMs?: number;
  maxRetries?: number;
}): Promise<RunRecord> {
  const { fight, cell } = opts;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: unknown = null;

  // Try primary model up to (maxRetries + 1) times; if all fail and a fallback exists, try fallback once.
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await attemptCall(fight, cell, timeoutMs, false);
    } catch (err) {
      lastError = err;
      // Backoff before retry (skip on last attempt)
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  // Fallback model id, single shot
  if (cell.model.fallbackModelId) {
    try {
      return await attemptCall(fight, cell, timeoutMs, true);
    } catch (err) {
      lastError = err;
    }
  }

  return {
    modelId: cell.model.id,
    variantIndex: cell.variantIndex,
    temperature: cell.temperature,
    runIndex: cell.runIndex,
    prompt: cell.variantPrompt,
    output: '',
    classification: 'unknown',
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    costUsd: 0,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  };
}

export async function runFight(opts: RunOptions): Promise<RunRecord[]> {
  if (opts.dryRun) return [];
  const cells = explodeCells(opts);
  const limit = pLimit(opts.concurrency);
  const total = cells.length;
  let done = 0;
  return Promise.all(
    cells.map((cell) =>
      limit(async () => {
        const record = await executeCell({
          fight: opts.fight,
          cell,
          timeoutMs: opts.callTimeoutMs,
          maxRetries: opts.maxRetries,
        });
        done++;
        opts.onProgress?.(done, total, record);
        return record;
      }),
    ),
  );
}
