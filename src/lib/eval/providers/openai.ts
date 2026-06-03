import { createOpenAI } from '@ai-sdk/openai';
import type { ProviderPricing } from '../types.ts';

// TODO: verify GPT-5 pricing when the model GAs. Placeholder values used here.
export const gpt5Pricing: ProviderPricing = {
  inputUsdPerMTok: 1.25,
  outputUsdPerMTok: 10.0,
};

// TODO: verify GPT-5-mini pricing.
export const gpt5MiniPricing: ProviderPricing = {
  inputUsdPerMTok: 0.25,
  outputUsdPerMTok: 2.0,
};

export function openaiClient() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
