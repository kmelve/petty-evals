# Petty Evals refresh: OpenRouter, new roster, new look, shareability

## Stage 1: One OpenRouter key
**Goal**: Every model call (generations, pundits, judge) goes through OpenRouter with a single `OPENROUTER_API_KEY`. No hardcoded pricing: real cost comes from OpenRouter usage accounting, dry-run estimates come from the live `/api/v1/models` pricing.
**Success Criteria**: `pnpm evals --fight=<slug> --dry-run` prints a plan with live prices and needs no key; direct provider SDKs removed from package.json.
**Tests**: roster ids unique + valid OpenRouter ids; pricing parser handles the models payload; cost extraction from provider metadata.
**Status**: Complete

## Stage 2: Popular coding-model roster + N-model pipeline
**Goal**: Roster picked from OpenRouter's programming popularity ranking (frontier labs + open-weight). Pundit prompts, verdict modes and report aggregation work for any panel size, not just four.
**Success Criteria**: No "four"/"three of four" assumptions left in pipeline code; `pnpm models:popular` prints the current top coding models to revisit the roster later.
**Tests**: classifyMode for unanimous / lone dissent / tie / split / unknown-winner with 8 models; pundit prompt names the panel size and the dissenters.
**Status**: Complete

## Stage 3: Look and feel
**Goal**: New visual direction chosen by Knut from in-browser variants (ui.sh picker), applied site-wide. Picked: Code review (each fight is a PR, models are reviewers). Site copy driven by data (panel size, run counts) instead of hardcoded numbers.
**Success Criteria**: `pnpm build` and `pnpm check` pass; homepage + fight page render with both old 4-model and new N-model result files.
**Tests**: build + check; visual check on desktop and mobile.
**Status**: Complete

## Stage 4: Shareability
**Goal**: Things people screenshot and post: OG cards with the split and the best dunk, per-quote share links, a cross-fight "beef" view (who disagrees with whom).
**Success Criteria**: Each fight's OG image shows verdict, split bar and a quote; quotes have permalinks + share intents.
**Tests**: build generates OG PNGs for every fight; beef matrix computation unit-tested.
**Status**: In Progress
