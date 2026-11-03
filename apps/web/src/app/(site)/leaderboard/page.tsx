import type { Metadata } from "next";
import Link from "next/link";
import { currentWibMonth, parseMonth, seasonLeaderboard, type SeasonRow } from "@/server/leaderboard";
import { PageHead } from "@/components/site/PageHead";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Season leaderboard: the top PawnPool players of the month.",
};

function shift(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

function label(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const current = currentWibMonth();
  let month = (await searchParams).month ?? current;
  try {
    parseMonth(month);
  } catch {
    month = current;
  }
  if (month > current) month = current;

  let rows: SeasonRow[] = [];
  let failed = false;
  try {
    rows = await seasonLeaderboard(month);
  } catch {
    failed = true;
  }
  const nav = "rounded-md border border-line px-3 py-1.5 text-sm hover:border-gold/60";

  return (
    <>
      <PageHead title="Season leaderboard" lead="Points from every event and the Practice Arena this month. Resets on the 1st." />
      <div className="mx-auto max-w-3xl px-5">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/leaderboard?month=${shift(month, -1)}`} className={nav} rel="nofollow">
            Previous month
          </Link>
          <h2 className="font-display text-xl font-bold">{label(month)}</h2>
          {month < current ? (
            <Link href={`/leaderboard?month=${shift(month, 1)}`} className={nav} rel="nofollow">
              Next month
            </Link>
          ) : (
            <span className={`${nav} pointer-events-none opacity-40`} aria-hidden="true">Next month</span>
          )}
        </div>

        {failed ? (
          <p role="alert" className="mt-8 rounded-md border border-line bg-panel px-4 py-3 text-muted">
            We could not load the leaderboard. Refresh in a moment.
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-muted">No points yet in {label(month)}. Play the Practice Arena to get on the board.</p>
        ) : (
          <ol className="mt-6 divide-y divide-line rounded-xl border border-line bg-panel">
            {rows.map((r) => (
              <li key={r.rank} className="flex items-center gap-4 px-4 py-3">
                <span className={`w-8 text-right font-display text-lg font-bold tabular-nums ${r.rank <= 3 ? "text-gold" : "text-muted"}`}>
                  {r.rank}
                </span>
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="tabular-nums text-foreground">{r.points.toLocaleString("en-US")}</span>
                <span className="text-sm text-muted">pts</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
