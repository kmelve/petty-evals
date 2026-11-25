import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPunditPrompt, classifyMode, cleanQuote, type PanelMember } from './pundit.ts';
import type { Fight } from './types.ts';

const fight: Fight = {
  slug: 'semicolons-js',
  title: 'Semicolons',
  question: 'Do AI models use semicolons in JavaScript?',
  category: 'formatting',
  promptVariants: ['Write a debounce function.'],
  classifier: { type: 'regex', pattern: 'semicolons-js' },
  submittedBy: 'test',
  dateAdded: '2026-11-25',
};

function votes(...v: string[]): Record<string, string> {
  return Object.fromEntries(v.map((label, i) => [`m${i}`, label]));
}

function panel(...v: string[]): PanelMember[] {
  return v.map((vote, i) => ({
    id: `m${i}`,
    name: `Model${i}`,
    lab: `Lab${i}`,
    openWeights: i % 2 === 0,
    vote,
    voteDistribution: { [vote]: 60 },
  }));
}

test('classifyMode: all eight agree is unanimous', () => {
  assert.equal(classifyMode(votes('a', 'a', 'a', 'a', 'a', 'a', 'a', 'a')), 'unanimous');
});

test('classifyMode: seven against one is lone-dissent', () => {
  assert.equal(classifyMode(votes('a', 'a', 'a', 'a', 'a', 'a', 'a', 'b')), 'lone-dissent');
});

test('classifyMode: five against three is majority', () => {
  assert.equal(classifyMode(votes('a', 'a', 'a', 'a', 'a', 'b', 'b', 'b')), 'majority');
});

test('classifyMode: four against four is tied', () => {
  assert.equal(classifyMode(votes('a', 'a', 'a', 'a', 'b', 'b', 'b', 'b')), 'tied');
});

test('classifyMode: unknown winning is unclear', () => {
  assert.equal(classifyMode(votes('unknown', 'unknown', 'unknown', 'a')), 'unclear');
});

test('classifyMode: four-model three-to-one still works', () => {
  assert.equal(classifyMode(votes('a', 'a', 'a', 'b')), 'lone-dissent');
});

test('buildPunditPrompt: states the real panel size', () => {
  const p = buildPunditPrompt({
    fight, panel: panel('a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'), selfId: 'm0', winner: 'a', mode: 'unanimous', representativeSample: '',
  });
  assert.match(p, /one of 8 AI models/);
  assert.match(p, /All 8 of you agreed/);
});

test('buildPunditPrompt: majority voter is told who the holdouts are', () => {
  const p = buildPunditPrompt({
    fight, panel: panel('a', 'a', 'a', 'a', 'a', 'b', 'b', 'c'), selfId: 'm0', winner: 'a', mode: 'majority', representativeSample: '',
  });
  assert.match(p, /5 of 8 voted A/);
  assert.match(p, /Model5, Model6 and Model7/);
});

test('buildPunditPrompt: lone dissenter is told they are alone', () => {
  const p = buildPunditPrompt({
    fight, panel: panel('a', 'a', 'a', 'b'), selfId: 'm3', winner: 'a', mode: 'lone-dissent', representativeSample: '',
  });
  assert.match(p, /lone dissenter/);
});

test('buildPunditPrompt: peer lines carry lab and weights', () => {
  const p = buildPunditPrompt({
    fight, panel: panel('a', 'b'), selfId: 'm0', winner: 'a', mode: 'tied', representativeSample: '',
  });
  assert.match(p, /Model1 \(Lab1, closed\) voted B/);
});

test('buildPunditPrompt: unknown self id throws', () => {
  assert.throws(() => buildPunditPrompt({
    fight, panel: panel('a'), selfId: 'nope', winner: 'a', mode: 'unanimous', representativeSample: '',
  }));
});

test('cleanQuote: strips wrapping straight and curly quotes', () => {
  assert.equal(cleanQuote('  “Tabs are for tables.”\n'), 'Tabs are for tables.');
});

test('cleanQuote: keeps a closing quote that belongs to an inner quotation', () => {
  const q = 'Tabs just means you called it "personal preference."';
  assert.equal(cleanQuote(q), q);
});
