import { createAnthropic } from '@ai-sdk/anthropic';
import type { ProviderPricing } from '../types.ts';

// Source: anthropic.com/pricing — verified 2026-06-03.
// Fable 5 verified against anthropic.com/news/claude-fable-5-mythos-5 2026-06-12.
export const claudeSonnet46Pricing: ProviderPricing = {
  inputUsdPerMTok: 3.0,
  outputUsdPerMTok: 15.0,
};

export const claudeOpus48Pricing: ProviderPricing = {
  inputUsdPerMTok: 5.0,
  outputUsdPerMTok: 25.0,
};

// Fable 5 — Mythos-class, sits above Opus.
// ~2× Opus pricing, 1M context window. Heavy for batch evals — keep
// disabled by default; flip enabled:true when running a Big Eval.
export const claudeFable5Pricing: ProviderPricing = {
  inputUsdPerMTok: 10.0,
  outputUsdPerMTok: 50.0,
};

// Haiku 4.5 — used as cheap LLM judge for ambiguous classifier outputs.
export const claudeHaiku45Pricing: ProviderPricing = {
  inputUsdPerMTok: 1.0,
  outputUsdPerMTok: 5.0,
};

export function anthropicClient() {
  // Channel uses ANTHROPIC_DEV_API_KEY; SDK default is ANTHROPIC_API_KEY.
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_DEV_API_KEY;
  return createAnthropic({ apiKey });
}
