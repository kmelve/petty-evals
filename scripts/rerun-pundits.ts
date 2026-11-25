#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { firePundits } from '../src/lib/eval/pundit.ts';
import type { Fight, FightResult } from '../src/lib/eval/types.ts';

async function loadFight(slug: string): Promise<Fight> {
  const file = path.resolve(process.cwd(), 'src/content/fights', slug + '.ts');
  const mod = await import(pathToFileURL(file).href);
  return mod.fight ?? mod.default;
}

async function rerunFile(jsonPath: string): Promise<void> {
  const raw = JSON.parse(await readFile(jsonPath, 'utf8')) as FightResult;
  const slug = raw.slug;
  const fight = await loadFight(slug);

  console.log('[' + slug + '] winner=' + raw.verdict.winner);
  await firePundits(fight, raw, (modelId, outcome) => {
    if ('quote' in outcome) console.log('  ' + modelId + ': ' + outcome.quote.slice(0, 140));
    else if ('error' in outcome) console.error('  ' + modelId + ' FAILED: ' + (outcome.error as Error).message);
    else console.log('  skip ' + modelId + ' (' + outcome.skipped + ')');
  });

  await writeFile(jsonPath, JSON.stringify(raw, null, 2) + '\n');
}

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  const dir = path.resolve(process.cwd(), 'src/data/results');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !f.includes('placeholder'));
  for (const f of files) slugs.push(f.replace('.json', ''));
}
for (const slug of slugs) {
  await rerunFile(path.resolve(process.cwd(), 'src/data/results', slug + '.json'));
}
