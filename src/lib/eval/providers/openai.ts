import { createOpenAI } from '@ai-sdk/openai';
import type { ProviderPricing } from '../types.ts';

// Source: openai.com/api/pricing — verified 2026-06-03.
export const gpt54Pricing: ProviderPricing = {
  inputUsdPerMTok: 2.5,
  outputUsdPerMTok: 15.0,
};

export const gpt54MiniPricing: ProviderPricing = {
  inputUsdPerMTok: 0.75,
  outputUsdPerMTok: 4.5,
};

export function openaiClient() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
