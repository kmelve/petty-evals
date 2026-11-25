// Shared types for the Petty Evals pipeline.

// Labels are fight-specific strings; 'unknown' means the classifier abstained.
export type Label = string;

export interface Fight {
  slug: string;
  title: string;
  question: string;
  category: string;
  promptVariants: string[];
  classifier: { type: 'regex'; pattern: string } | { type: 'llm-judge'; pattern: string };
  /** The answers a reader can pick, in display order. Classifier labels like 'mixed' are not sides. */
  sides: Array<{ label: Label; name: string }>;
  /** Shown on the fight page when the author has a stake in the answer. */
  disclosure?: string;
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
  /** Lab name for new results; old 4-model results stored the SDK provider here. */
  provider: string;
  shortName?: string;
  openrouterId?: string;
  openWeights?: boolean;
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

export type ReasoningEffort = 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';

export interface ModelConfig {
  /** Stable id used in result JSON and URLs. */
  id: string;
  displayName: string;
  /** What other pundits call this model in a dunk ("Kimi", "GPT"). */
  shortName: string;
  lab: string;
  /** OpenRouter model slug, e.g. `anthropic/claude-sonnet-5.5`. */
  openrouterId: string;
  openWeights: boolean;
  /** Defaults to DEFAULT_REASONING_EFFORT in providers/openrouter.ts. */
  reasoningEffort?: ReasoningEffort;
  enabled: boolean;
}
