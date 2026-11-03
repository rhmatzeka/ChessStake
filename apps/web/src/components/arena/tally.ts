export type TallyRow = { uci: string; count: number; pct: number };

/** Votes per candidate (in candidate order) with a rounded percentage of all votes. */
export function tallyShares(
  candidates: { uci: string }[],
  tally: { uci: string; count: number }[],
): { rows: TallyRow[]; total: number } {
  const counts = new Map(tally.map((t) => [t.uci, t.count]));
  const total = candidates.reduce((n, c) => n + (counts.get(c.uci) ?? 0), 0);
  const rows = candidates.map((c) => {
    const count = counts.get(c.uci) ?? 0;
    return { uci: c.uci, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
  return { rows, total };
}
