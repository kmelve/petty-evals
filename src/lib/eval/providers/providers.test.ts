import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, enabledModels, findModel } from './index.ts';
import { costFromProviderMetadata, fetchLivePricing, parsePricing } from './openrouter.ts';

test('roster: ids are unique', () => {
  const ids = MODELS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('roster: short names are unique among enabled models', () => {
  const names = enabledModels().map((m) => m.shortName);
  assert.equal(new Set(names).size, names.length);
});

test('roster: every OpenRouter id is a vendor/model slug', () => {
  for (const m of MODELS) assert.match(m.openrouterId, /^[a-z0-9-]+\/[a-z0-9.\-]+$/, m.openrouterId);
});

test('roster: panel mixes closed and open-weight models', () => {
  const enabled = enabledModels();
  assert.ok(enabled.some((m) => m.openWeights));
  assert.ok(enabled.some((m) => !m.openWeights));
});

test('findModel: returns undefined for retired ids from old results', () => {
  assert.equal(findModel('gpt-5.4'), undefined);
});

test('parsePricing: converts per-token strings to per-million numbers', () => {
  const out = parsePricing({ data: [{ id: 'a/b', pricing: { prompt: '0.000002', completion: '0.00001' } }] });
  assert.deepEqual(out['a/b'], { inputUsdPerMTok: 2, outputUsdPerMTok: 10 });
});

test('parsePricing: skips router pseudo-models with negative prices', () => {
  const out = parsePricing({ data: [{ id: 'openrouter/auto', pricing: { prompt: '-1', completion: '-1' } }] });
  assert.equal(out['openrouter/auto'], undefined);
});

test('parsePricing: skips models without pricing', () => {
  assert.deepEqual(parsePricing({ data: [{ id: 'x/y' }] }), {});
});

test('fetchLivePricing: throws with status on HTTP error', async () => {
  const fakeFetch = (async () => new Response('nope', { status: 503, statusText: 'Service Unavailable' })) as typeof fetch;
  await assert.rejects(fetchLivePricing(fakeFetch), /503/);
});

test('costFromProviderMetadata: reads openrouter usage cost', () => {
  assert.equal(costFromProviderMetadata({ openrouter: { usage: { cost: 0.0123 } } }), 0.0123);
});

test('costFromProviderMetadata: missing metadata is zero', () => {
  assert.equal(costFromProviderMetadata(undefined), 0);
});
