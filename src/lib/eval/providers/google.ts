import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ProviderPricing } from '../types.ts';

// Source: ai.google.dev/pricing — verified 2026-06-03.
export const gemini25ProPricing: ProviderPricing = {
  inputUsdPerMTok: 1.25,
  outputUsdPerMTok: 10.0,
};

// Gemini 3 Pro is preview; pricing approximate until GA. V1.1 stub.
export const gemini3ProPricing: ProviderPricing = {
  inputUsdPerMTok: 2.0,
  outputUsdPerMTok: 12.0,
};

export function googleClient() {
  // Channel uses GEMINI_API_KEY; SDK default is GOOGLE_GENERATIVE_AI_API_KEY.
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  return createGoogleGenerativeAI({ apiKey });
}
