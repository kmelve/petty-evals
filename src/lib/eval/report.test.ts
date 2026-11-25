import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, computeVerdict, panelFromResult, summarizeRuns } from './report.ts';
import { MODELS } from './providers/index.ts';
import type { Fight, RunRecord } from './types.ts';

const fight: Fight = {
  slug: 'quotes-js',
  title: 'Quotes',
  question: 'Single or double quotes?',
  category: 'formatting',
  promptVariants: ['p'],
  classifier: { type: 'regex', pattern: 'quotes-js' },
  sides: [{ label: 'single', name: 'single quotes' }, { label: 'double', name: 'double quotes' }],
  submittedBy: 'test',
  dateAdded: '2026-11-25',
};

function run(modelId: string, classification: string, costUsd = 0.01): RunRecord {
  return {
    modelId, variantIndex: 0, temperature: 0, runIndex: 0, prompt: 'p', output: 'o',
    classification, inputTokens: 1, outputTokens: 1, latencyMs: 1, costUsd,
  };
}

test('summarizeRuns: modal vote and confidence', () => {
  const s = summarizeRuns([run('x', 'single'), run('x', 'single'), run('x', 'double')]);
  assert.equal(s.vote, 'single');
  assert.equal(s.confidence, 2 / 3);
});

test('summarizeRuns: no runs gives unknown with zero confidence', () => {
  const s = summarizeRuns([]);
  assert.equal(s.vote, 'unknown');
  assert.equal(s.confidence, 0);
});

test('computeVerdict: unanimous has zero disagreement', () => {
  const v = computeVerdict([{ vote: 'a' }, { vote: 'a' }, { vote: 'a' }]);
  assert.equal(v.winner, 'a');
  assert.equal(v.disagreementIndex, 0);
});

test('aggregate: one model result per configured model, with roster metadata', () => {
  const models = MODELS.slice(0, 2);
  const result = aggregate(fight, [run(models[0].id, 'single'), run(models[1].id, 'double')], models, 's', 'f');
  assert.equal(result.models.length, 2);
  assert.equal(result.models[0].shortName, models[0].shortName);
  assert.equal(result.models[0].provider, models[0].lab);
});

test('aggregate: total cost sums run costs', () => {
  const models = MODELS.slice(0, 1);
  const result = aggregate(fight, [run(models[0].id, 'a', 0.5), run(models[0].id, 'a', 0.25)], models, 's', 'f');
  assert.equal(result.totalCostUsd, 0.75);
});

test('panelFromResult: old results without shortName fall back to displayName', () => {
  const panel = panelFromResult({
    slug: 'x', runStartedAt: '', runFinishedAt: '', totalCostUsd: 0, totalRuns: 0, classifierKappa: null,
    verdict: { winner: 'a', tally: { a: 1 }, disagreementIndex: 0 },
    models: [{
      id: 'gpt-5.4', displayName: 'GPT-5.4', provider: 'openai', vote: 'a', voteDistribution: { a: 1 },
      confidence: 1, confidenceCI95: [0, 1], punditQuote: null, runs: [],
    }],
  });
  assert.equal(panel[0].name, 'GPT-5.4');
});

test('summarizeRuns: abstentions are not votes', () => {
  const runs = [...Array(33)].map(() => run('x', 'unknown')).concat([...Array(27)].map(() => run('x', 'short')));
  const s = summarizeRuns(runs);
  assert.equal(s.vote, 'short');
  assert.equal(s.confidence, 1);
  assert.equal(s.voteDistribution.unknown, 33);
});

test('summarizeRuns: all abstentions vote unknown', () => {
  const s = summarizeRuns([run('x', 'unknown'), run('x', 'unknown')]);
  assert.equal(s.vote, 'unknown');
});

test('summarizeRuns: confidence counts only readable runs', () => {
  const s = summarizeRuns([run('x', 'a'), run('x', 'a'), run('x', 'b'), run('x', 'unknown')]);
  assert.equal(s.confidence, 2 / 3);
});
