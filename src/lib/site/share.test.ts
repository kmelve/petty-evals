import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteShareLinks, shareText } from './share.ts';

test('shareText: short quotes pass through with attribution', () => {
  assert.equal(shareText('Tabs are for tables.', 'Opus', 'Tabs vs spaces'), '“Tabs are for tables.” — Opus, on Tabs vs spaces');
});

test('shareText: long quotes are trimmed to fit the limit', () => {
  const text = shareText('x'.repeat(400), 'Opus', 'Tabs vs spaces');
  assert.ok(text.length <= 256, `length ${text.length}`);
  assert.match(text, /…” — Opus/);
});

test('quoteShareLinks: permalink targets the review anchor', () => {
  const links = quoteShareLinks({ slug: 'quotes-js', modelId: 'glm-5.3', modelName: 'GLM', fightTitle: 'Quotes', quote: 'q' });
  assert.equal(links.url, 'https://pettyevals.dev/fights/quotes-js#review-glm-5.3');
});

test('quoteShareLinks: intents carry the encoded text', () => {
  const links = quoteShareLinks({ slug: 's', modelId: 'm', modelName: 'M', fightTitle: 'T', quote: 'a & b' });
  assert.ok(links.x.startsWith('https://x.com/intent/post?'));
  assert.ok(new URL(links.bluesky).searchParams.get('text')!.includes('a & b'));
});
