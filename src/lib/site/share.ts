// Share intents for pundit quotes. Plain links, no third-party scripts.

export const SITE_URL = 'https://petty-evals.dev';

export interface ShareLinks {
  url: string;
  x: string;
  bluesky: string;
  text: string;
}

/** Keep the post under X's 280 characters, counting the link as 23 (t.co). */
export function shareText(quote: string, modelName: string, fightTitle: string, maxLength = 280 - 24): string {
  const suffix = ` — ${modelName}, on ${fightTitle}`;
  const room = maxLength - suffix.length - 2;
  const body = quote.length > room ? quote.slice(0, room - 1).trimEnd() + '…' : quote;
  return `“${body}”${suffix}`;
}

export function quoteShareLinks(opts: { slug: string; modelId: string; modelName: string; fightTitle: string; quote: string }): ShareLinks {
  const url = `${SITE_URL}/fights/${opts.slug}#review-${opts.modelId}`;
  const text = shareText(opts.quote, opts.modelName, opts.fightTitle);
  return {
    url,
    text,
    x: `https://x.com/intent/post?${new URLSearchParams({ text, url })}`,
    bluesky: `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${text} ${url}` })}`,
  };
}
