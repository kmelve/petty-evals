// Provider registry. V1 ships 4 enabled models; stubs for V1.1 expansion.
//
// Pricing + model IDs verified 2026-06-03 against:
//  - anthropic.com/pricing
//  - openai.com/api/pricing
//  - ai.google.dev/pricing
//  - SDK .d.ts files for current valid model ID strings

import type { ModelConfig } from '../types.ts';
import { anthropicClient, claudeSonnet46Pricing, claudeOpus48Pricing } from './anthropic.ts';
import { openaiClient, gpt54Pricing, gpt54MiniPricing } from './openai.ts';
import { googleClient, gemini25ProPricing, gemini3ProPricing } from './google.ts';
import type { LanguageModel } from 'ai';

export const MODELS: ModelConfig[] = [
  {
    id: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-6',
    pricing: claudeSonnet46Pricing,
    enabled: true,
  },
  {
    id: 'gpt-5.4',
    displayName: 'GPT-5.4',
    provider: 'openai',
    modelId: 'gpt-5.4',
    fallbackModelId: 'gpt-5',
    pricing: gpt54Pricing,
    enabled: true,
  },
  {
    id: 'gpt-5.4-mini',
    displayName: 'GPT-5.4 mini',
    provider: 'openai',
    modelId: 'gpt-5.4-mini',
    fallbackModelId: 'gpt-5-mini',
    pricing: gpt54MiniPricing,
    enabled: true,
  },
  {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    pricing: gemini25ProPricing,
    enabled: true,
  },
  // ---- V1.1 stubs ----
  {
    id: 'gemini-3-pro-preview',
    displayName: 'Gemini 3 Pro (preview)',
    provider: 'google',
    modelId: 'gemini-3-pro-preview',
    pricing: gemini3ProPricing,
    enabled: false,
  },
  {
    id: 'claude-opus-4-8',
    displayName: 'Claude Opus 4.8',
    provider: 'anthropic',
    modelId: 'claude-opus-4-8',
    pricing: claudeOpus48Pricing,
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
export function resolveModel(config: ModelConfig, useFallback = false): LanguageModel {
  const modelId = useFallback && config.fallbackModelId ? config.fallbackModelId : config.modelId;
  switch (config.provider) {
    case 'anthropic':
      return anthropicClient()(modelId);
    case 'openai':
      return openaiClient()(modelId);
    case 'google':
      return googleClient()(modelId);
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
