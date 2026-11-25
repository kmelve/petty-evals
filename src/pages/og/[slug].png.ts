// Share cards: one per fight, plus /og/home.png for the homepage.

import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { summarize, modelName } from '../../lib/site/fight-summary.ts';
import { fightCard, homeCard, renderPng } from '../../lib/site/og.ts';

export const getStaticPaths: GetStaticPaths = async () => {
  const fights = await getCollection('fights');
  return [{ params: { slug: 'home' } }, ...fights.map((f) => ({ params: { slug: f.id } }))];
};

export const GET: APIRoute = async ({ params }) => {
  const fights = await getCollection('fights');
  const results = (await getCollection('results')).map((r) => r.data);

  let node;
  if (params.slug === 'home') {
    const summaries = results.map((r) => summarize({ ...r, sides: fights.find((f) => f.id === r.slug)?.data.sides }));
    const largest = results.reduce((a, b) => (b.models.length > a.models.length ? b : a), results[0]);
    node = homeCard({
      fights: fights.length,
      contested: summaries.filter((s) => s.mode !== 'unanimous').length,
      names: largest ? largest.models.map(modelName) : [],
      samples: results.reduce((s, r) => s + r.totalRuns, 0),
    });
  } else {
    const fight = fights.find((f) => f.id === params.slug)!;
    const result = results.find((r) => r.slug === params.slug);
    const title = fight.data.title.replace(/[?.]$/, '');
    node = result
      ? fightCard({ title, summary: summarize({ ...result, slug: fight.id, sides: fight.data.sides }), votes: Object.fromEntries(result.models.map((m) => [m.id, m.vote])) })
      : homeCard({ fights: fights.length, contested: 0, names: [], samples: 0 });
  }

  return new Response(new Uint8Array(await renderPng(node)), { headers: { 'Content-Type': 'image/png' } });
};
