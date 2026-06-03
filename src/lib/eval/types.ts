// Shared types for the Petty Evals pipeline.

export type ClassificationLabel = 'tabs' | 'spaces' | 'unknown';
// Generic label union — extend as new fights add new labels.
export type Label = string;

export interface Fight {
  slug: string;
  title: string;
  question: string;
  category: string;
  promptVariants: string[];
  classifier: { type: 'regex'; pattern: string } | { type: 'llm-judge'; pattern: string };
  submittedBy: string;
  dateAdded: string;
}

export interface RunRecord {
  modelId: string;
  variantIndex: number;
  temperature: number;
  runIndex: number;
  prompt: string;
  output: string;
  classification: Label;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  error?: string;
}

export interface ModelResult {
  id: string;
  displayName: string;
  provider: string;
  vote: Label;
  voteDistribution: Record<string, number>;
  confidence: number;
  confidenceCI95: [number, number];
  punditQuote: string | null;
  runs: RunRecord[];
}

export interface FightResult {
  slug: string;
  runStartedAt: string;
  runFinishedAt: string;
  totalCostUsd: number;
  totalRuns: number;
  models: ModelResult[];
  verdict: {
    winner: Label;
    tally: Record<string, number>;
    disagreementIndex: number;
  };
  classifierKappa: number | null;
  placeholder?: boolean;
}

export interface ProviderPricing {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
}

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: 'anthropic' | 'openai' | 'google' | 'openrouter';
  modelId: string;
  fallbackModelId?: string;
  pricing: ProviderPricing;
  enabled: boolean;
}
