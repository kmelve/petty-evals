// Shared lookups for the per-side share pages and their OG images.

import { getCollection, type CollectionEntry } from 'astro:content';
import { modelName } from './fight-summary.ts';
import { sideVerdict, type SideVerdict } from './sides.ts';
import { SITE_URL } from './share.ts';

export interface SidePage {
  slug: string;
  side: string;
  fight: CollectionEntry<'fights'>;
  result: CollectionEntry<'results'>['data'];
  verdict: SideVerdict;
  url: string;
}

/** Every fight × side that has a result to compare against. */
export async function allSidePages(): Promise<SidePage[]> {
  const fights = await getCollection('fights');
  const results = await getCollection('results');
  const pages: SidePage[] = [];
  for (const fight of fights) {
    const result = results.find((r) => r.data.slug === fight.id)?.data;
    if (!result) continue;
    const panel = result.models.map((m) => ({ id: m.id, name: modelName(m), vote: m.vote }));
    for (const side of fight.data.sides) {
      pages.push({
        slug: fight.id,
        side: side.label,
        fight,
        result,
        verdict: sideVerdict({ pick: side.label, name: side.name, panel }),
        url: `${SITE_URL}/fights/${fight.id}/${side.label}`,
      });
    }
  }
  return pages;
}
