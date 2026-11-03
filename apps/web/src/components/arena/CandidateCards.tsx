import type { PublicState } from "@/server/events";
import { CANDIDATE_COLORS } from "./geometry";
import { formatEval, qualityBadge } from "./quality";
import { tallyShares } from "./tally";

type Turn = NonNullable<PublicState["turn"]>;

export function QualityBadge({ quality }: { quality: "best" | "okay" | "blunder" }) {
  const b = qualityBadge(quality);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${b.classes}`}>
      <span aria-hidden="true">{b.glyph}</span>
      {b.text}
    </span>
  );
}

/** The three moves the crowd can pick now. Each card is a button; the bar shows the live share of picks. */
export function CandidateCards({
  turn,
  pick,
  canPick,
  onPick,
  interactive = true,
  compact = false,
}: {
  turn: Turn;
  pick: string | null;
  canPick: boolean;
  onPick: (uci: string) => void;
  interactive?: boolean;
  compact?: boolean;
}) {
  const { rows, total } = tallyShares(turn.candidates, turn.tally);
  return (
    <ul className={`grid gap-2 ${compact ? "grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-1"}`}>
      {turn.candidates.map((c, i) => {
        const row = rows[i]!;
        const color = CANDIDATE_COLORS[i % CANDIDATE_COLORS.length]!;
        const picked = pick === c.uci;
        const body = (
          <>
            <span className="flex items-start gap-2">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 sm:block">
                <span className={`block font-display font-bold leading-snug ${compact ? "text-base" : "text-[17px]"}`}>{c.label}</span>
                <span className="block text-sm text-muted">{c.san}</span>
              </span>
              {picked && (
                <span className="ml-auto shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-black">Your pick</span>
              )}
            </span>
            <span className="mt-1.5 flex items-center gap-2 sm:mt-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${row.pct}%`, background: color }}
                />
              </span>
              <span className="w-24 text-right text-xs tabular-nums text-muted">
                {row.count} {row.count === 1 ? "pick" : "picks"}
                {total > 0 ? ` (${row.pct}%)` : ""}
              </span>
            </span>
          </>
        );
        const base = "block w-full rounded-xl border px-2.5 py-2 text-left sm:p-3 transition-colors";
        const tone = picked ? "border-gold bg-panel-hi" : "border-line bg-panel hover:border-gold/50";
        return (
          <li key={c.uci}>
            {interactive ? (
              <button
                type="button"
                onClick={() => onPick(c.uci)}
                aria-label={`Pick: ${c.label}, ${c.san}`}
                aria-pressed={picked}
                aria-disabled={!canPick}
                className={`${base} ${tone} ${canPick ? "" : "cursor-not-allowed opacity-70"}`}
                style={picked ? { boxShadow: `0 0 0 1px ${color}` } : undefined}
              >
                {body}
              </button>
            ) : (
              <div className={`${base} ${tone}`}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The previous turn's three moves with their quality, shown briefly after the turn resolves. */
export function RevealCards({ item, bossSan }: { item: PublicState["history"][number]; bossSan: string | null }) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted" role="status">
        The crowd played <span className="font-semibold text-foreground">{item.crowdSan}</span>
        {bossSan ? (
          <>
            . The Boss answered <span className="font-semibold text-foreground">{bossSan}</span>.
          </>
        ) : (
          "."
        )}
      </p>
      <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {item.candidates.map((c, i) => {
          const played = c.san === item.crowdSan;
          const color = CANDIDATE_COLORS[i % CANDIDATE_COLORS.length]!;
          return (
            <li
              key={c.uci}
              className={`rounded-xl border p-3 ${played ? "border-gold bg-panel-hi" : "border-line bg-panel"}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-display text-[17px] font-bold leading-snug">{c.label}</p>
                  <p className="text-sm text-muted">
                    {c.san} <span className="tabular-nums">({formatEval(c.evalCp)})</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <QualityBadge quality={c.quality} />
                {played && <span className="text-xs font-semibold text-gold">Played</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
