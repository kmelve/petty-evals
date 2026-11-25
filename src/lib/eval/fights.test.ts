import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import type { Fight } from './types.ts';

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../content/fights');
const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
const classifierSource = readFileSync(path.join(dir, '../../lib/eval/classifiers/regex.ts'), 'utf8');

for (const file of files) {
  test(`${file}: sides are labels the classifier can return`, async () => {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    const fight: Fight = mod.fight ?? mod.default;
    assert.ok(fight.sides.length >= 2, 'needs at least two sides');
    for (const side of fight.sides) {
      assert.ok(classifierSource.includes(`'${side.label}'`), `classifier never returns '${side.label}'`);
      assert.match(side.label, /^[A-Za-z0-9_-]+$/, 'label must be URL-safe');
    }
  });
}
