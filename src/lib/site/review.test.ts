import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initials, prStatus, rankBg, reviewState } from './review.ts';

test('reviewState: voting with the winner is an approval', () => {
  assert.equal(reviewState('spaces', 'spaces'), 'approved');
});

test('reviewState: voting against the winner requests changes', () => {
  assert.equal(reviewState('tabs', 'spaces'), 'changes-requested');
});

test('reviewState: unclassifiable output is just a comment', () => {
  assert.equal(reviewState('unknown', 'spaces'), 'commented');
});

test('prStatus: a tie blocks the merge', () => {
  assert.equal(prStatus('tied').label, 'Blocked');
});

test('rankBg: ranks past the palette reuse the last color', () => {
  assert.equal(rankBg(9), rankBg(3));
});

test('initials: camel-cased names use their capitals', () => {
  assert.equal(initials('DeepSeek'), 'DS');
  assert.equal(initials('MiniMax'), 'MM');
});

test('initials: all-caps and plain names use the first two letters', () => {
  assert.equal(initials('GPT'), 'GP');
  assert.equal(initials('Kimi'), 'Ki');
});
