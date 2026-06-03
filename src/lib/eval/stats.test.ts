// Inline unit tests for stats primitives.
// Run with: pnpm test:stats

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wilsonInterval, shannonEntropy, cohensKappa } from './stats.ts';

// ---------------- tests ----------------

test('wilsonInterval: balanced case 5/10 brackets 0.5', () => {
  const [lo, hi] = wilsonInterval(5, 10);
  assert.ok(lo < 0.5 && hi > 0.5, `expected to bracket 0.5, got [${lo}, ${hi}]`);
  assert.ok(lo > 0.18 && lo < 0.25, `unexpected lower bound ${lo}`);
  assert.ok(hi > 0.75 && hi < 0.82, `unexpected upper bound ${hi}`);
});

test('wilsonInterval: 9/10 is asymmetric, lower bound well above 0.5', () => {
  const [lo, hi] = wilsonInterval(9, 10);
  assert.ok(lo > 0.55, `lower should be above 0.55, got ${lo}`);
  assert.ok(hi < 1, `upper should be < 1, got ${hi}`);
});

test('wilsonInterval: 0/10 has lower bound 0, upper bound positive', () => {
  const [lo, hi] = wilsonInterval(0, 10);
  assert.equal(lo, 0);
  assert.ok(hi > 0 && hi < 0.4);
});

test('wilsonInterval: total = 0 returns [0, 0]', () => {
  assert.deepEqual(wilsonInterval(0, 0), [0, 0]);
});

test('shannonEntropy: uniform over 2 categories = 1.0', () => {
  assert.equal(shannonEntropy([5, 5]), 1);
});

test('shannonEntropy: degenerate distribution = 0.0', () => {
  assert.equal(shannonEntropy([10, 0, 0]), 0);
});

test('shannonEntropy: uniform over 4 categories = 1.0', () => {
  assert.ok(Math.abs(shannonEntropy([1, 1, 1, 1]) - 1) < 1e-12);
});

test('shannonEntropy: empty / single bucket = 0', () => {
  assert.equal(shannonEntropy([]), 0);
  assert.equal(shannonEntropy([7]), 0);
});

test("cohensKappa: perfect agreement = 1.0", () => {
  assert.equal(cohensKappa(['a', 'b', 'a', 'b'], ['a', 'b', 'a', 'b']), 1);
});

test("cohensKappa: chance agreement near 0", () => {
  // Both raters pick 'a' half the time at random, but disagree on which half.
  const k = cohensKappa(['a', 'a', 'b', 'b'], ['a', 'b', 'a', 'b']);
  assert.ok(Math.abs(k) < 0.01, `expected kappa ~0, got ${k}`);
});

test("cohensKappa: total disagreement = -1.0", () => {
  assert.equal(cohensKappa(['a', 'b'], ['b', 'a']), -1);
});
