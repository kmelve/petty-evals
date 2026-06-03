// Provider registry. V1 ships 4 enabled models; 4 more are stubbed for keys.

import type { ModelConfig } from '../types.ts';
import { anthropicClient, claudeSonnet45Pricing, claudeOpus45Pricing } from './anthropic.ts';
import { openaiClient, gpt5Pricing, gpt5MiniPricing } from './openai.ts';
import { googleClient, gemini25ProPricing } from './google.ts';
import type { LanguageModel } from 'ai';

export const MODELS: ModelConfig[] = [
  {
    id: 'claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5',
    pricing: claudeSonnet45Pricing,
    enabled: true,
  },
  {
    id: 'gpt-5',
    displayName: 'GPT-5',
    provider: 'openai',
    modelId: 'gpt-5',
    fallbackModelId: 'gpt-4o',
    pricing: gpt5Pricing,
    enabled: true,
  },
  {
    id: 'gpt-5-mini',
    displayName: 'GPT-5 mini',
    provider: 'openai',
    modelId: 'gpt-5-mini',
    fallbackModelId: 'gpt-4o-mini',
    pricing: gpt5MiniPricing,
    enabled: true,
  },
  {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    fallbackModelId: 'gemini-1.5-pro',
    pricing: gemini25ProPricing,
    enabled: true,
  },
  // ---- stubs: enable once keys + pricing are confirmed ----
  {
    id: 'claude-opus-4-5',
    displayName: 'Claude Opus 4.5',
    provider: 'anthropic',
    modelId: 'claude-opus-4-5',
    pricing: claudeOpus45Pricing,
    enabled: false,
  },
  {
    id: 'grok-4',
    displayName: 'Grok 4',
    provider: 'openrouter',
    modelId: 'x-ai/grok-4',
    pricing: { inputUsdPerMTok: 5.0, outputUsdPerMTok: 15.0 }, // TODO verify
    enabled: false,
  },
  {
    id: 'deepseek-v3.5',
    displayName: 'DeepSeek V3.5',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-chat',
    pricing: { inputUsdPerMTok: 0.27, outputUsdPerMTok: 1.1 }, // TODO verify
    enabled: false,
  },
  {
    id: 'qwen-3-coder',
    displayName: 'Qwen 3 Coder',
    provider: 'openrouter',
    modelId: 'qwen/qwen-3-coder',
    pricing: { inputUsdPerMTok: 0.3, outputUsdPerMTok: 1.2 }, // TODO verify
    enabled: false,
  },
];

export function enabledModels(): ModelConfig[] {
  return MODELS.filter((m) => m.enabled);
}

/**
 * Resolve a LanguageModel handle from the AI SDK for a configured model.
 * Lazy — only constructs the provider client on first use, so dry runs work
 * even when API keys are absent.
 */
export function resolveModel(config: ModelConfig): LanguageModel {
  switch (config.provider) {
    case 'anthropic':
      return anthropicClient()(config.modelId);
    case 'openai':
      return openaiClient()(config.modelId);
    case 'google':
      return googleClient()(config.modelId);
    case 'openrouter':
      throw new Error('OpenRouter provider not yet wired (V1 stub).');
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unhandled provider: ${_exhaustive}`);
    }
  }
}

export function computeCostUsd(
  pricing: ProviderPricingLike,
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens / 1_000_000) * pricing.inputUsdPerMTok +
    (outputTokens / 1_000_000) * pricing.outputUsdPerMTok
  );
}

type ProviderPricingLike = { inputUsdPerMTok: number; outputUsdPerMTok: number };
