import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBeef, findPair, type BeefFight } from './beef.ts';

function fight(slug: string, winner: string, votes: Record<string, string>): BeefFight {
  return { slug, title: slug, winner, models: Object.entries(votes).map(([id, vote]) => ({ id, name: id.toUpperCase(), vote })) };
}

const fights = [
  fight('one', 'x', { a: 'x', b: 'x', c: 'y' }),
  fight('two', 'x', { a: 'x', b: 'y', c: 'y' }),
  fight('three', 'x', { a: 'x', b: 'x', c: 'unknown' }),
];

test('computeBeef: counts clashes per pair', () => {
  const beef = computeBeef(fights);
  assert.equal(findPair(beef, 'a', 'c')?.clashes, 2);
  assert.equal(findPair(beef, 'a', 'b')?.clashes, 1);
});

test('computeBeef: unknown votes are not counted as shared fights', () => {
  const beef = computeBeef(fights);
  assert.equal(findPair(beef, 'a', 'c')?.shared, 2);
});

test('computeBeef: pair lookup is order-independent', () => {
  const beef = computeBeef(fights);
  assert.equal(findPair(beef, 'c', 'a'), findPair(beef, 'a', 'c'));
});

test('computeBeef: biggest beef comes first', () => {
  const beef = computeBeef(fights);
  assert.deepEqual([beef.pairs[0].a, beef.pairs[0].b], ['a', 'c']);
  assert.deepEqual(beef.pairs[0].fights, ['one', 'two']);
});

test('computeBeef: contrarians ranked by share of fights lost', () => {
  const beef = computeBeef(fights);
  assert.equal(beef.contrarians[0].id, 'c');
  assert.equal(beef.contrarians[0].againstMajority, 2);
  assert.equal(beef.contrarians.at(-1)!.id, 'a');
});
