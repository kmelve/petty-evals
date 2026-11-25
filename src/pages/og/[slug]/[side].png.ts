// Share card for a reader's pick: /og/<fight>/<side>.png

import type { APIRoute, GetStaticPaths } from 'astro';
import { allSidePages, type SidePage } from '../../../lib/site/side-pages.ts';
import { renderPng, sideCard } from '../../../lib/site/og.ts';

export const getStaticPaths: GetStaticPaths = async () =>
  (await allSidePages()).map((page) => ({ params: { slug: page.slug, side: page.side }, props: { page } }));

export const GET: APIRoute = async ({ props }) => {
  const { page } = props as { page: SidePage };
  const png = await renderPng(sideCard({ title: page.fight.data.title.replace(/[?.]$/, ''), verdict: page.verdict }));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
