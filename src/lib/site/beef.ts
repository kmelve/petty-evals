// Cross-fight rivalries: how often each pair of models voted differently,
// and how often each model ended up on the losing side.

export interface BeefFight {
  slug: string;
  title: string;
  winner: string;
  models: Array<{ id: string; name: string; vote: string }>;
}

export interface Pair {
  a: string;
  b: string;
  /** Fights both models voted in (with a readable vote). */
  shared: number;
  /** Fights where they voted differently. */
  clashes: number;
  /** Slugs of the fights where they clashed. */
  fights: string[];
}

export interface ContrarianRow {
  id: string;
  name: string;
  fights: number;
  /** Fights where the model's vote was not the winner. */
  againstMajority: number;
}

export interface Beef {
  models: Array<{ id: string; name: string }>;
  pairs: Pair[];
  contrarians: ContrarianRow[];
}

const isReadable = (vote: string) => vote !== 'unknown';

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function computeBeef(fights: BeefFight[]): Beef {
  const names = new Map<string, string>();
  const pairs = new Map<string, Pair>();
  const contrarian = new Map<string, ContrarianRow>();

  for (const fight of fights) {
    const voters = fight.models.filter((m) => isReadable(m.vote));
    for (const m of fight.models) names.set(m.id, m.name);
    for (const m of voters) {
      const row = contrarian.get(m.id) ?? { id: m.id, name: m.name, fights: 0, againstMajority: 0 };
      row.fights++;
      if (m.vote !== fight.winner) row.againstMajority++;
      contrarian.set(m.id, row);
    }
    for (let i = 0; i < voters.length; i++) {
      for (let j = i + 1; j < voters.length; j++) {
        const [x, y] = [voters[i], voters[j]];
        const key = pairKey(x.id, y.id);
        const [a, b] = x.id < y.id ? [x.id, y.id] : [y.id, x.id];
        const pair = pairs.get(key) ?? { a, b, shared: 0, clashes: 0, fights: [] };
        pair.shared++;
        if (x.vote !== y.vote) {
          pair.clashes++;
          pair.fights.push(fight.slug);
        }
        pairs.set(key, pair);
      }
    }
  }

  return {
    models: [...names].map(([id, name]) => ({ id, name })),
    pairs: [...pairs.values()].sort((p, q) => q.clashes - p.clashes || p.a.localeCompare(q.a)),
    contrarians: [...contrarian.values()].sort(
      (p, q) => q.againstMajority / Math.max(1, q.fights) - p.againstMajority / Math.max(1, p.fights) || p.name.localeCompare(q.name),
    ),
  };
}

export function findPair(beef: Beef, a: string, b: string): Pair | undefined {
  return beef.pairs.find((p) => pairKey(p.a, p.b) === pairKey(a, b));
}
