// Dynamic OG share card for each fight.
// Uses the site palette: cream bg, coral accent, ink text. Chunky.

import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const fights = await getCollection('fights');
const results = await getCollection('results');
const resultBySlug = new Map(results.map((r) => [r.data.slug, r.data]));

interface PageMeta {
  title: string;
  verdict: string;
  tally: string;
  hasResult: boolean;
}

const pages: Record<string, PageMeta> = Object.fromEntries(
  fights.map((f) => {
    const r = resultBySlug.get(f.data.slug);
    const tally = r
      ? Object.entries(r.verdict.tally)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${v} ${k}`)
          .join(' · ')
      : '';
    return [
      f.data.slug,
      {
        title: f.data.title.replace(/[?.]$/, '') + '?',
        verdict: r ? r.verdict.winner.toUpperCase() : 'PENDING',
        tally,
        hasResult: !!r,
      },
    ];
  })
);

// Color tokens (RGB tuples for astro-og-canvas).
const CREAM: [number, number, number] = [255, 248, 231];
const INK: [number, number, number] = [26, 26, 26];
const CORAL: [number, number, number] = [255, 92, 92];
export const { getStaticPaths, GET } = await OGImageRoute<PageMeta>({
  param: 'slug',
  pages,
  // Route filename already supplies the .png extension; return the bare key.
  getSlug: (path) => path,
  getImageOptions: (_path, page) => ({
    // Use the verdict as the eye-catcher — that's what gets shared.
    title: page.hasResult ? page.verdict : page.title,
    description: page.hasResult ? `${page.tally}  ·  petty evals` : 'petty evals · run pending',
    bgGradient: [CREAM],
    border: { color: INK, width: 8 },
    padding: 80,
    font: {
      title: {
        size: 180,
        color: CORAL,
        weight: 'Bold',
        lineHeight: 1,
      },
      description: {
        size: 36,
        color: INK,
        weight: 'Bold',
        lineHeight: 1.2,
      },
    },
    logo: undefined,
  }),
});
