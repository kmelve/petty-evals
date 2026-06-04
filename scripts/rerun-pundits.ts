#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import {
  buildPunditPrompt,
  callPundit,
  pickRepresentativeSample,
  classifyMode,
} from '../src/lib/eval/pundit.ts';
import { MODELS } from '../src/lib/eval/providers/index.ts';
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

  const voteTally: Record<string, Record<string, number>> = {};
  const modelVotes: Record<string, string> = {};
  const representativeSamples: Record<string, string> = {};
  for (const m of raw.models) {
    voteTally[m.id] = m.voteDistribution;
    modelVotes[m.id] = m.vote;
    representativeSamples[m.id] = pickRepresentativeSample(m.runs, m.vote);
  }
  const winner = raw.verdict.winner;
  const mode = classifyMode(modelVotes);

  console.log('[' + slug + '] mode=' + mode + ' winner=' + winner);

  for (const m of raw.models) {
    const config = MODELS.find((c) => c.id === m.id);
    if (!config) {
      console.log('  skip ' + m.id + ' (no config)');
      continue;
    }
    const prompt = buildPunditPrompt({
      fight,
      voteTally,
      modelVotes,
      representativeSamples,
      selfModelId: m.id,
      winner,
      mode,
    });
    try {
      const quote = await callPundit(config, prompt);
      m.punditQuote = quote;
      console.log('  ' + m.id + ': ' + quote.slice(0, 140));
    } catch (err) {
      console.error('  ' + m.id + ' FAILED: ' + (err as Error).message);
    }
  }

  await writeFile(jsonPath, JSON.stringify(raw, null, 2));
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
