// Dynamic OG share card for each fight.
// astro-og-canvas v0.11 returns a Promise — we await it at module top level.

import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const fights = await getCollection('fights');
const results = await getCollection('results');
const resultBySlug = new Map(results.map((r) => [r.data.slug, r.data]));

interface PageMeta {
  title: string;
  description: string;
}

const pages: Record<string, PageMeta> = Object.fromEntries(
  fights.map((f) => {
    const r = resultBySlug.get(f.data.slug);
    const tally = r
      ? Object.entries(r.verdict.tally)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} ${v}`)
          .join(' — ')
      : 'pending';
    return [
      f.data.slug,
      {
        title: f.data.title,
        description: r ? `Verdict: ${r.verdict.winner} (${tally})` : 'Run pending',
      },
    ];
  })
);

export const { getStaticPaths, GET } = await OGImageRoute<PageMeta>({
  param: 'slug',
  pages,
  // Route filename already supplies the .png extension; return the bare key.
  getSlug: (path) => path,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[250, 250, 247]],
    border: { color: [17, 17, 17], width: 4 },
    padding: 60,
    font: {
      title: { size: 64, color: [17, 17, 17], weight: 'Bold' },
      description: { size: 28, color: [107, 107, 107], weight: 'Normal' },
    },
  }),
});
