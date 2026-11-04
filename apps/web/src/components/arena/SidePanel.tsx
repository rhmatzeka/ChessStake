import type { PublicState } from "@/server/events";
import type { AuthUser, MyState } from "@/hooks/useMyState";
import { SignInLoader } from "@/components/auth/SignInLoader";
import { QualityBadge } from "./CandidateCards";
import { formatEval } from "./quality";

export function MeCard({
  user,
  onUser,
  openSignal,
  me,
}: {
  user: AuthUser | null | undefined;
  onUser: (u: AuthUser | null) => void;
  openSignal: number;
  me: MyState | null;
}) {
  return (
    <>
      {user && me && (
        <dl className="mb-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Points" value={me.points} />
          <Stat label="Rank" value={me.rank ? `#${me.rank}` : "-"} />
          <Stat label="Turns" value={me.turnsPicked} />
        </dl>
      )}
      <SignInLoader user={user} onUser={onUser} openSignal={openSignal} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background px-2 py-2">
      <dd className="font-display text-xl font-black tabular-nums text-gold">{value}</dd>
      <dt className="th !text-[0.6rem]">{label}</dt>
    </div>
  );
}

export function TopList({ top }: { top: PublicState["top"] }) {
  if (top.length === 0) return <p className="text-sm text-muted">Nobody has points yet. Pick a move to get on the board.</p>;
  return (
    <ol className="space-y-1.5 text-sm">
      {top.map((t, i) => (
        <li key={`${t.name}-${i}`} className="flex items-baseline gap-2">
          <span className="w-6 text-right tabular-nums text-muted">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate">{t.name}</span>
          <span className="tabular-nums text-gold">{t.points}</span>
        </li>
      ))}
    </ol>
  );
}

export function SponsorCard({ sponsor }: { sponsor: NonNullable<PublicState["sponsor"]> }) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        {sponsor.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain" />
        )}
        <div className="min-w-0">
          <p className="th">Prizes from</p>
          <p className="truncate font-display text-base font-bold">{sponsor.name}</p>
        </div>
      </div>
      {sponsor.prizeText && <p className="mt-1.5 truncate text-sm text-gold" title={sponsor.prizeText}>{sponsor.prizeText}</p>}
    </>
  );
  return sponsor.url ? (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="panel panel-gold block shrink-0 px-3 py-2 transition-colors hover:border-gold"
    >
      {inner}
    </a>
  ) : (
    <div className="panel panel-gold shrink-0 px-3 py-2">{inner}</div>
  );
}

export function MoveLog({ history }: { history: PublicState["history"] }) {
  if (history.length === 0) return <p className="text-sm text-muted">Moves appear here after each turn.</p>;
  return (
    <ol className="-mx-2 space-y-1 text-sm">
      {history.map((h) => {
        const played = h.candidates.find((c) => c.san === h.crowdSan);
        return (
          <li key={h.number}>
            <details className="group rounded-lg px-2 py-1.5 open:bg-background">
              <summary className="flex cursor-pointer list-none items-center gap-2">
                <span className="w-6 shrink-0 text-right tabular-nums text-muted">{h.number}</span>
                <span className="font-medium">{h.crowdSan}</span>
                {played && <QualityBadge quality={played.quality} />}
                {h.bossSan && <span className="ml-auto text-muted">Boss {h.bossSan}</span>}
              </summary>
              <ul className="mt-2 space-y-1 pl-8 text-xs text-muted">
                {h.candidates.map((c) => (
                  <li key={c.uci} className="flex items-center gap-2">
                    <span className={c.san === h.crowdSan ? "font-semibold text-foreground" : ""}>{c.label}</span>
                    <span>{c.san}</span>
                    <span className="tabular-nums">{formatEval(c.evalCp)}</span>
                    <QualityBadge quality={c.quality} />
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
