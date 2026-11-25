// The panel. Every model is called through OpenRouter (see ./openrouter.ts).
//
// Roster picked 2026-11-25 from OpenRouter's programming-category popularity
// ranking, balanced so the big US labs face off against the open-weight
// models developers actually route coding traffic to. Run
// `pnpm models:popular` to see the current ranking when it's time to revisit.
//
// `shortName` is what the pundits call each other ("Kimi", "GLM"), so keep it
// to something a developer would say out loud.

import type { ModelConfig } from '../types.ts';

export const MODELS: ModelConfig[] = [
  // ---- Frontier labs ----
  {
    id: 'claude-opus-5.5',
    displayName: 'Claude Opus 5.5',
    shortName: 'Opus',
    lab: 'Anthropic',
    openrouterId: 'anthropic/claude-opus-5.5',
    openWeights: false,
    enabled: true,
  },
  {
    id: 'claude-sonnet-5.5',
    displayName: 'Claude Sonnet 5.5',
    shortName: 'Sonnet',
    lab: 'Anthropic',
    openrouterId: 'anthropic/claude-sonnet-5.5',
    openWeights: false,
    enabled: true,
  },
  {
    id: 'gpt-6.2-sol',
    displayName: 'GPT-6.2 Sol',
    shortName: 'GPT',
    lab: 'OpenAI',
    openrouterId: 'openai/gpt-6.2-sol',
    openWeights: false,
    enabled: true,
  },
  {
    id: 'gemini-4-neon',
    displayName: 'Gemini 4 Neon',
    shortName: 'Gemini',
    lab: 'Google',
    openrouterId: 'google/gemini-4-neon',
    openWeights: false,
    enabled: true,
  },
  // ---- Open weights ----
  {
    id: 'kimi-k3.1-pro',
    displayName: 'Kimi K3.1 Pro',
    shortName: 'Kimi',
    lab: 'Moonshot AI',
    openrouterId: 'moonshotai/kimi-k3.1-pro',
    openWeights: true,
    enabled: true,
  },
  {
    id: 'glm-5.3',
    displayName: 'GLM 5.3',
    shortName: 'GLM',
    lab: 'Z.ai',
    openrouterId: 'z-ai/glm-5.3',
    openWeights: true,
    enabled: true,
  },
  {
    id: 'deepseek-v4.1-flash',
    displayName: 'DeepSeek V4.1 Flash',
    shortName: 'DeepSeek',
    lab: 'DeepSeek',
    openrouterId: 'deepseek/deepseek-v4.1-flash',
    openWeights: true,
    enabled: true,
  },
  {
    id: 'minimax-m3.1-flash',
    displayName: 'MiniMax M3.1 Flash',
    shortName: 'MiniMax',
    lab: 'MiniMax',
    openrouterId: 'minimax/minimax-m3.1-flash',
    openWeights: true,
    enabled: true,
  },
  // ---- Benched: flip `enabled` to bring them in ----
  {
    id: 'grok-4.7',
    displayName: 'Grok 4.7',
    shortName: 'Grok',
    lab: 'xAI',
    openrouterId: 'x-ai/grok-4.7',
    openWeights: false,
    enabled: false,
  },
  {
    id: 'qwen4-max',
    displayName: 'Qwen4 Max',
    shortName: 'Qwen',
    lab: 'Alibaba',
    openrouterId: 'qwen/qwen4-max',
    openWeights: false,
    enabled: false,
  },
  {
    id: 'devstral-2',
    displayName: 'Devstral 2',
    shortName: 'Devstral',
    lab: 'Mistral',
    openrouterId: 'mistralai/devstral-2512',
    openWeights: true,
    enabled: false,
  },
  // $8/$40 per MTok. Only for a deliberate Big Eval.
  {
    id: 'claude-fable-5.2',
    displayName: 'Claude Fable 5.2',
    shortName: 'Fable',
    lab: 'Anthropic',
    openrouterId: 'anthropic/claude-fable-5.2',
    openWeights: false,
    enabled: false,
  },
];

/** Cheap, fast model used for LLM-judge classification. */
export const JUDGE_MODEL: Pick<ModelConfig, 'openrouterId' | 'reasoningEffort'> = {
  openrouterId: 'anthropic/claude-haiku-5.5',
  reasoningEffort: 'low',
};

export function enabledModels(): ModelConfig[] {
  return MODELS.filter((m) => m.enabled);
}

export function findModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

export { resolveModel } from './openrouter.ts';
