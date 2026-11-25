// Single gateway for every model call: OpenRouter.
//
// One key (OPENROUTER_API_KEY) covers every lab. Usage accounting is switched
// on so each response carries its real USD cost — no pricing tables to keep
// in sync by hand.

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import type { ModelConfig, ReasoningEffort } from '../types.ts';

const MODELS_URL = 'https://openrouter.ai/api/v1/models';

/** Reasoning effort used unless a model overrides it. Style choices don't need deep thought, and reasoning tokens are billed. */
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'low';

let client: ReturnType<typeof createOpenRouter> | null = null;

function openrouter() {
  if (client) return client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to .env (see .env.example) or export it in your shell.');
  }
  client = createOpenRouter({
    apiKey,
    compatibility: 'strict',
    appName: 'Petty Evals',
    appUrl: 'https://pettyevals.dev',
  });
  return client;
}

/**
 * Resolve an AI SDK model handle. Lazy: dry runs never construct the client,
 * so they work without a key.
 */
export function resolveModel(config: Pick<ModelConfig, 'openrouterId' | 'reasoningEffort'>): LanguageModel {
  return openrouter().chat(config.openrouterId, {
    usage: { include: true },
    reasoning: { effort: config.reasoningEffort ?? DEFAULT_REASONING_EFFORT, exclude: true },
  });
}

/** Pull the billed USD cost out of an AI SDK result's provider metadata. Returns 0 when absent. */
export function costFromProviderMetadata(metadata: unknown): number {
  const cost = (metadata as { openrouter?: { usage?: { cost?: unknown } } } | undefined)?.openrouter?.usage?.cost;
  return typeof cost === 'number' && Number.isFinite(cost) ? cost : 0;
}

export interface LivePricing {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
}

interface OpenRouterModelsPayload {
  data: Array<{ id: string; pricing?: { prompt?: string; completion?: string } }>;
}

/** Parse the public /models payload into per-million-token prices, keyed by OpenRouter id. */
export function parsePricing(payload: OpenRouterModelsPayload): Record<string, LivePricing> {
  const out: Record<string, LivePricing> = {};
  for (const m of payload.data) {
    const input = Number(m.pricing?.prompt);
    const output = Number(m.pricing?.completion);
    // Router pseudo-models (openrouter/auto etc.) report negative prices.
    if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) continue;
    out[m.id] = { inputUsdPerMTok: input * 1_000_000, outputUsdPerMTok: output * 1_000_000 };
  }
  return out;
}

/** Fetch live pricing. Public endpoint, no key needed. */
export async function fetchLivePricing(fetchImpl: typeof fetch = fetch): Promise<Record<string, LivePricing>> {
  const res = await fetchImpl(MODELS_URL);
  if (!res.ok) throw new Error(`OpenRouter /models returned ${res.status} ${res.statusText}`);
  return parsePricing((await res.json()) as OpenRouterModelsPayload);
}

export function estimateCostUsd(pricing: LivePricing, inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * pricing.inputUsdPerMTok + (outputTokens / 1_000_000) * pricing.outputUsdPerMTok;
}
