import { createAnthropic } from '@ai-sdk/anthropic';
import type { ProviderPricing } from '../types.ts';

// Pricing per million tokens, USD. Source: Anthropic pricing page, 2026-06.
export const claudeSonnet45Pricing: ProviderPricing = {
  inputUsdPerMTok: 3.0,
  outputUsdPerMTok: 15.0,
};

export const claudeOpus45Pricing: ProviderPricing = {
  inputUsdPerMTok: 15.0,
  outputUsdPerMTok: 75.0,
};

export function anthropicClient() {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_DEV_API_KEY });
}
