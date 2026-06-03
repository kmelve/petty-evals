import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import type { Fight } from './lib/eval/types.ts';

// Eager-load every fight file. Vite resolves the glob at build time, so this
// works in both `astro dev` and `astro build` without dynamic-import warnings.
const fightModules = import.meta.glob<{ fight?: Fight; default?: Fight }>(
  './content/fights/*.ts',
  { eager: true }
);

const fights = defineCollection({
  loader: () =>
    Object.values(fightModules).map((mod) => {
      const f = mod.fight ?? mod.default;
      if (!f) throw new Error('Fight module missing a `fight` (or default) export');
      return { id: f.slug, ...f };
    }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    question: z.string(),
    category: z.string(),
    promptVariants: z.array(z.string()).min(1),
    classifier: z.object({
      type: z.enum(['regex', 'llm-judge']),
      pattern: z.string(),
    }),
    submittedBy: z.string(),
    dateAdded: z.string(),
  }),
});

const results = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/results' }),
  schema: z.object({
    slug: z.string(),
    runStartedAt: z.string(),
    runFinishedAt: z.string(),
    totalCostUsd: z.number(),
    totalRuns: z.number(),
    placeholder: z.boolean().optional(),
    models: z.array(
      z.object({
        id: z.string(),
        displayName: z.string(),
        provider: z.string(),
        vote: z.string(),
        voteDistribution: z.record(z.string(), z.number()),
        confidence: z.number(),
        confidenceCI95: z.tuple([z.number(), z.number()]),
        punditQuote: z.string().nullable(),
        runs: z.array(z.any()),
      })
    ),
    verdict: z.object({
      winner: z.string(),
      tally: z.record(z.string(), z.number()),
      disagreementIndex: z.number(),
    }),
    classifierKappa: z.number().nullable(),
  }),
});

export const collections = { fights, results };
