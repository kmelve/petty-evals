import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listNames, noOrphan, sideVerdict, type PanelVote } from './sides.ts';

function panel(...votes: string[]): PanelVote[] {
  return votes.map((vote, i) => ({ id: `m${i}`, name: `M${i}`, vote }));
}

test('sideVerdict: siding with a unanimous panel', () => {
  const v = sideVerdict({ pick: 'interface', name: 'interface', panel: panel(...Array(8).fill('interface')) });
  assert.equal(v.tone, 'agree');
  assert.equal(v.kicker, '8 AI models agree with me:');
  assert.equal(v.stamp, 'LGTM ×8');
});

test('sideVerdict: against a unanimous panel is merging anyway', () => {
  const v = sideVerdict({ pick: 'type', name: 'type', panel: panel(...Array(8).fill('interface')) });
  assert.equal(v.tone, 'against');
  assert.match(v.footer, /Merging anyway/);
});

test('sideVerdict: a 4–4 split is a merge conflict', () => {
  const v = sideVerdict({ pick: 'a', name: 'a', panel: panel('a', 'a', 'a', 'a', 'b', 'b', 'b', 'b') });
  assert.equal(v.tone, 'split');
  assert.equal(v.stamp, 'Merge conflict');
});

test('sideVerdict: abstentions count for nobody', () => {
  const v = sideVerdict({ pick: 'short', name: '[]', panel: panel('short', 'short', 'unknown') });
  assert.equal(v.kicker, '2 AI models agree with me:');
  assert.equal(v.abstained.length, 1);
});

test('sideVerdict: minority pick names its allies', () => {
  const v = sideVerdict({ pick: 'b', name: 'b', panel: panel('a', 'a', 'a', 'b') });
  assert.equal(v.footer, 'M3 gets it. Everyone else is wrong.');
});

test('sideVerdict: code-like picks get no trailing period and render as code', () => {
  assert.equal(sideVerdict({ pick: 'x', name: '===', panel: panel('x') }).headline, '===');
  assert.equal(sideVerdict({ pick: 'x', name: 'snake_case', panel: panel('x') }).isCode, true);
  assert.equal(sideVerdict({ pick: 'x', name: 'tabs', panel: panel('x') }).headline, 'tabs.');
});

test('listNames: joins with commas and a final and', () => {
  assert.equal(listNames(['A', 'B', 'C']), 'A, B and C');
});

test('noOrphan: binds the last two words', () => {
  assert.equal(noOrphan('Merging anyway.'), 'Merging anyway.');
});
