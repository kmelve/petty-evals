import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prettyLabel, summarize, type SummaryModel } from './fight-summary.ts';

function model(id: string, vote: string, quote: string | null = `${id} says ${vote}`): SummaryModel {
  return { id, displayName: id.toUpperCase(), shortName: id, vote, punditQuote: quote };
}

function input(models: SummaryModel[]) {
  const tally: Record<string, number> = {};
  for (const m of models) tally[m.vote] = (tally[m.vote] ?? 0) + 1;
  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
  return { verdict: { winner, tally }, models };
}

test('summarize: unanimous eight-model panel', () => {
  const s = summarize(input(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => model(id, 'spaces'))));
  assert.equal(s.mode, 'unanimous');
  assert.equal(s.score, '8–0');
  assert.match(s.headline, /the other side|8–0|eight|Eight/);
});

test('summarize: lone dissenter gets the featured quote', () => {
  const s = summarize(input([model('a', 'x'), model('b', 'x'), model('c', 'x'), model('d', 'y', 'I alone have taste.')]));
  assert.equal(s.mode, 'lone-dissent');
  assert.equal(s.featuredQuote?.modelId, 'd');
});

test('summarize: segments are ordered winners first', () => {
  const s = summarize(input([model('a', 'y'), model('b', 'x'), model('c', 'x')]));
  assert.deepEqual(s.segments.map((x) => x.vote), ['x', 'x', 'y']);
  assert.deepEqual(s.segments.map((x) => x.rank), [0, 0, 1]);
});

test('summarize: unknown sorts after a real label with the same count', () => {
  const s = summarize(input([model('a', 'unknown'), model('b', 'css-file')]));
  assert.equal(s.labels[0].label, 'css-file');
});

test('summarize: unanimous fight features the shortest quote', () => {
  const s = summarize(input([model('a', 'x', 'a much longer quote than the other'), model('b', 'x', 'short')]));
  assert.equal(s.featuredQuote?.text, 'short');
});

test('summarize: no quotes means no featured quote', () => {
  const s = summarize(input([model('a', 'x', null), model('b', 'x', '')]));
  assert.equal(s.featuredQuote, null);
});

test('summarize: tied headline names both sides', () => {
  const s = summarize(input([model('a', 'interface'), model('b', 'type')]));
  assert.equal(s.mode, 'tied');
  assert.match(s.headline, /interface vs\. type|type vs\. interface/);
});

test('summarize: unanimous headline talks to the losing side by its display name', () => {
  const sides = [{ label: 'triple-equals', name: '===' }, { label: 'double-equals', name: '==' }];
  const s = summarize({ ...input(['a', 'b', 'c'].map((id) => model(id, 'triple-equals'))), slug: 'x', sides });
  assert.match(s.headline, /==(?!=)/);
  assert.equal(s.winnerName, '===');
});

test('summarize: lone dissent names the dissenter', () => {
  const s = summarize(input([model('a', 'x'), model('b', 'x'), model('c', 'x'), model('Kimi', 'y')]));
  assert.match(s.headline, /^X wins 3–1\. Kimi voted y/);
});

test('prettyLabel: dashes become spaces and unknown reads as unreadable', () => {
  assert.equal(prettyLabel('no-trailing'), 'no trailing');
  assert.equal(prettyLabel('unknown'), 'unreadable');
});
