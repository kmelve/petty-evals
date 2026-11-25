// "Pick your side": what the panel thinks of the reader's choice, worded for share cards.

export interface PanelVote {
  id: string;
  name: string;
  vote: string;
}

export type SideTone = 'agree' | 'against' | 'split';

export interface SideVerdict {
  pick: string;
  /** Display name of the pick ("===", "tabs"). */
  name: string;
  tone: SideTone;
  withMe: PanelVote[];
  against: PanelVote[];
  /** Models whose code never touched the question. */
  abstained: PanelVote[];
  /** Line above the big pick: "8 AI models agree with me:". */
  kicker: string;
  /** The pick as it appears on the card, with a period only when it reads as a word. */
  headline: string;
  /** True for picks that are code ("===", "fn() =>", "snake_case"): render them in mono. */
  isCode: boolean;
  /** One line under the avatars. */
  footer: string;
  /** Rubber-stamp text. */
  stamp: string;
  /** Post text for X and Bluesky (the link is added separately). */
  shareText: string;
}

/** "A", "A and B", "A, B and C". */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** Glue the last two words together so a line never ends with one orphaned word. */
export function noOrphan(text: string): string {
  const i = text.lastIndexOf(' ');
  return i > 0 ? text.slice(0, i) + ' ' + text.slice(i + 1) : text;
}

export function sideVerdict(opts: { pick: string; name: string; panel: PanelVote[] }): SideVerdict {
  const { pick, name, panel } = opts;
  const withMe = panel.filter((m) => m.vote === pick);
  const abstained = panel.filter((m) => m.vote === 'unknown');
  const against = panel.filter((m) => m.vote !== pick && m.vote !== 'unknown');
  const voters = withMe.length + against.length;
  const tone: SideTone = withMe.length > against.length ? 'agree' : withMe.length < against.length ? 'against' : 'split';
  const isCode = /[^A-Za-z0-9 '-]/.test(name);
  const headline = !isCode && /[A-Za-z]$/.test(name) ? `${name}.` : name;

  let kicker: string;
  let footer: string;
  let stamp: string;
  let shareText: string;
  if (tone === 'agree' && against.length === 0) {
    kicker = `${withMe.length} AI models agree with me:`;
    footer = `Approved by all ${withMe.length} reviewers.`;
    stamp = `LGTM ×${withMe.length}`;
    shareText = `${withMe.length} AI models agree with me: ${headline}`;
  } else if (tone === 'agree') {
    kicker = `${withMe.length} of ${voters} AI models agree with me:`;
    footer = `${listNames(against.map((m) => m.name))} requested changes. Overruled.`;
    stamp = `LGTM ${withMe.length}/${voters}`;
    shareText = `${withMe.length} of ${voters} AI models agree with me: ${headline} (${listNames(against.map((m) => m.name))} can cope.)`;
  } else if (tone === 'against' && withMe.length === 0) {
    kicker = `${against.length} AI models think I'm wrong about`;
    footer = 'Merging anyway.';
    stamp = 'Changes requested';
    shareText = `${against.length} AI models think I'm wrong about ${name}. Merging anyway.`;
  } else if (tone === 'against') {
    kicker = `Only ${withMe.length} of ${voters} AI models agree with me on`;
    footer = `${listNames(withMe.map((m) => m.name))} ${withMe.length === 1 ? 'gets' : 'get'} it. Everyone else is wrong.`;
    stamp = `${against.length} against`;
    shareText = `Only ${withMe.length} of ${voters} AI models agree with me on ${name}. ${listNames(withMe.map((m) => m.name))} ${withMe.length === 1 ? 'gets' : 'get'} it.`;
  } else {
    kicker = `The AI models split ${withMe.length}–${against.length} on`;
    footer = 'Tie goes to me.';
    stamp = 'Merge conflict';
    shareText = `The AI models split ${withMe.length}–${against.length} on ${name}. Tie goes to me.`;
  }

  return { pick, name, tone, withMe, against, abstained, kicker, headline, isCode, footer, stamp, shareText };
}
