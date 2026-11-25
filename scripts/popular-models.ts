#!/usr/bin/env node
// Print OpenRouter's most-used programming models and mark which ones are on
// the panel. Use it when the roster in providers/index.ts feels stale.
//
// Usage: pnpm models:popular [--top=N]

import { MODELS } from '../src/lib/eval/providers/index.ts';
import { estimateCostUsd, parsePricing } from '../src/lib/eval/providers/openrouter.ts';

const URL = 'https://openrouter.ai/api/v1/models?category=programming';

const topArg = process.argv.find((a) => a.startsWith('--top='));
const top = topArg ? Number.parseInt(topArg.slice('--top='.length), 10) : 25;

const res = await fetch(URL);
if (!res.ok) throw new Error(`OpenRouter returned ${res.status} ${res.statusText}`);
const payload = (await res.json()) as { data: Array<{ id: string; name: string; pricing?: { prompt?: string; completion?: string } }> };
const pricing = parsePricing(payload);
const roster = new Map(MODELS.map((m) => [m.openrouterId, m]));

console.log(`OpenRouter programming ranking, top ${top} (order as returned by the API)\n`);
console.log('  #  panel     model                                      $/1k runs*');
payload.data.slice(0, top).forEach((m, i) => {
  const cfg = roster.get(m.id);
  const mark = cfg ? (cfg.enabled ? 'ON     ' : 'benched') : '       ';
  const p = pricing[m.id];
  const per1k = p ? `$${(1000 * estimateCostUsd(p, 80, 600)).toFixed(2)}` : '—';
  console.log(`${String(i + 1).padStart(3)}  ${mark}  ${m.id.padEnd(42)} ${per1k}`);
});

const missing = MODELS.filter((m) => m.enabled && !payload.data.some((d) => d.id === m.openrouterId));
if (missing.length) {
  console.log(`\nEnabled models not in the programming category: ${missing.map((m) => m.openrouterId).join(', ')}`);
}
console.log('\n* rough cost of 1,000 generations at 80 input / 600 output tokens');
