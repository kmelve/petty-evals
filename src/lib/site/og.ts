// Open Graph cards (1200×630) rendered with satori + resvg at build time.
// Same code-review look as the site: status pill, verdict, vote strip, the spiciest review.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { FightSummary } from './fight-summary.ts';
import { prettyLabel } from './fight-summary.ts';
import { initials, prStatus, reviewState } from './review.ts';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Tailwind palette values, mirrored for satori (it can't read CSS variables).
const C = {
  ink: '#09090b',
  body: '#3f3f46',
  muted: '#71717a',
  line: '#e4e4e7',
  wash: '#fafafa',
  sky: '#0369a1',
  rank: ['#10b981', '#fbbf24', '#f43f5e', '#a1a1aa'],
  pill: {
    Approved: ['#ecfdf5', '#047857'],
    'Approved, 1 dissent': ['#ecfdf5', '#047857'],
    'Changes requested': ['#fffbeb', '#92400e'],
    Blocked: ['#fff1f2', '#be123c'],
    'Needs triage': ['#f4f4f5', '#3f3f46'],
  } as Record<string, [string, string]>,
};

type Node = { type: string; props: Record<string, unknown> };

function h(type: string, style: Record<string, unknown>, ...children: Array<Node | string | null | false>): Node {
  const kids = children.filter((c): c is Node | string => Boolean(c));
  return { type, props: { style: { display: 'flex', ...style }, children: kids.length === 1 ? kids[0] : kids } };
}

const rankColor = (rank: number) => C.rank[Math.min(rank, C.rank.length - 1)];

function clip(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
}

function header(right: Node | null): Node {
  return h(
    'div',
    { justifyContent: 'space-between', alignItems: 'center' },
    h('div', { fontSize: 26, color: C.muted, gap: 10 }, 'kmelve', h('span', { color: '#a1a1aa' }, '/'), h('span', { color: C.ink, fontWeight: 600 }, 'petty-evals')),
    right,
  );
}

function pill(label: string): Node {
  const [bg, fg] = C.pill[label] ?? C.pill['Needs triage'];
  return h('div', { background: bg, color: fg, borderRadius: 999, padding: '8px 20px', fontSize: 24, fontWeight: 600 }, label);
}

function avatar(name: string, rank: number, size = 56): Node {
  return h(
    'div',
    {
      width: size, height: size, borderRadius: 999, background: rankColor(rank), color: 'white',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist Mono', fontSize: size * 0.36, fontWeight: 500,
      border: '4px solid white', marginLeft: -10,
    },
    initials(name),
  );
}

export function fightCard(opts: { title: string; summary: FightSummary; votes: Record<string, string> }): Node {
  const { title, summary } = opts;
  const quote = summary.featuredQuote;
  const quoteRank = quote ? summary.segments.find((s) => s.modelId === quote.modelId)?.rank ?? 0 : 0;
  const quoteState = quote ? reviewState(opts.votes[quote.modelId] ?? summary.winner, summary.winner) : 'approved';
  return h(
    'div',
    { width: '100%', height: '100%', boxSizing: 'border-box', flexDirection: 'column', background: 'white', padding: '48px 64px', fontFamily: 'Mona Sans', color: C.ink, gap: 26 },
    header(pill(prStatus(summary.mode).label)),
    h('div', { fontSize: 46, fontWeight: 600, letterSpacing: -1 }, clip(title.replace(/`/g, ''), 52) + '?'),
    h(
      'div',
      { alignItems: 'center', justifyContent: 'space-between' },
      h('div', { fontSize: 92, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }, clip(prettyLabel(summary.winner), 18)),
      h('div', { alignItems: 'center', gap: 28 },
        h('div', { paddingLeft: 10 }, ...summary.segments.map((s) => avatar(s.name, s.rank))),
        h('div', { fontFamily: 'Geist Mono', fontSize: 64, fontWeight: 500 }, summary.score),
      ),
    ),
    h('div', { gap: 8, height: 14 }, ...summary.segments.map((s) => h('div', { flex: 1, background: rankColor(s.rank), borderRadius: 4 }))),
    quote
      ? h(
          'div',
          { flexDirection: 'column', border: `2px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', flex: 1 },
          h('div', { background: C.wash, borderBottom: `2px solid ${C.line}`, padding: '12px 22px', fontSize: 22, color: C.muted, gap: 8, alignItems: 'center' },
            h('div', { width: 14, height: 14, borderRadius: 999, background: rankColor(quoteRank) }),
            h('span', { color: C.ink, fontWeight: 600 }, quote.name),
            quoteState === 'approved' ? 'approved' : quoteState === 'commented' ? 'commented' : 'requested changes',
          ),
          h('div', { padding: '16px 22px', fontSize: 29, lineHeight: 1.35, color: C.body }, clip(quote.text, 170)),
        )
      : h('div', { flex: 1, fontSize: 30, color: C.body }, summary.headline),
  );
}

export function homeCard(opts: { fights: number; contested: number; names: string[]; samples: number }): Node {
  return h(
    'div',
    { width: '100%', height: '100%', boxSizing: 'border-box', flexDirection: 'column', justifyContent: 'space-between', background: 'white', padding: '56px 64px', fontFamily: 'Mona Sans', color: C.ink },
    header(pill('Changes requested')),
    h('div', { flexDirection: 'column', gap: 20 },
      h('div', { fontSize: 72, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05, maxWidth: 1000 }, `Settle every petty code-style argument, forever #${opts.fights}`),
      h('div', { fontSize: 30, color: C.body }, `${opts.names.length} AI coding models · ${opts.samples.toLocaleString('en-US')} code samples · ${opts.contested} fights they couldn't agree on`),
    ),
    h('div', { alignItems: 'center', justifyContent: 'space-between' },
      h('div', { paddingLeft: 10 }, ...opts.names.map((n, i) => avatar(n, i % 2 === 0 ? 0 : 1, 72))),
      h('div', { fontFamily: 'Geist Mono', fontSize: 28, color: C.muted }, 'pettyevals.dev'),
    ),
  );
}

let fontCache: Array<{ name: string; data: Buffer; weight: 400 | 500 | 600 | 700; style: 'normal' }> | null = null;

async function fonts() {
  if (fontCache) return fontCache;
  const file = (pkg: string, name: string) => readFile(path.join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', name));
  fontCache = [
    { name: 'Mona Sans', data: await file('mona-sans', 'mona-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Mona Sans', data: await file('mona-sans', 'mona-sans-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Mona Sans', data: await file('mona-sans', 'mona-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Geist Mono', data: await file('geist-mono', 'geist-mono-latin-500-normal.woff'), weight: 500, style: 'normal' },
  ];
  return fontCache;
}

export async function renderPng(node: Node): Promise<Buffer> {
  const svg = await satori(node as unknown as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts: await fonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
