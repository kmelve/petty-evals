import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ProviderPricing } from '../types.ts';

// Pricing per million tokens, USD. Source: Google AI pricing page, 2026-06.
export const gemini25ProPricing: ProviderPricing = {
  inputUsdPerMTok: 1.25,
  outputUsdPerMTok: 10.0,
};

export function googleClient() {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
}
