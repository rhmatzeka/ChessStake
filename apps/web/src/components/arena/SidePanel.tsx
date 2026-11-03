import type { PublicState } from "@/server/events";
import type { AuthUser, MyState } from "@/hooks/useMyState";
import { SignInLoader } from "@/components/auth/SignInLoader";
import { QualityBadge } from "./CandidateCards";
import { formatEval } from "./quality";

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

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
    <Panel title={user ? "You" : "Join the crowd"}>
      {user && me && (
        <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Points" value={me.points} />
          <Stat label="Rank" value={me.rank ? `#${me.rank}` : "-"} />
          <Stat label="Turns" value={me.turnsPicked} />
        </dl>
      )}
      <SignInLoader user={user} onUser={onUser} openSignal={openSignal} />
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background px-2 py-2">
      <dd className="font-display text-xl font-bold tabular-nums text-gold">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}

export function TopList({ top }: { top: PublicState["top"] }) {
  return (
    <Panel title="Top players">
      {top.length === 0 ? (
        <p className="text-sm text-muted">Nobody has points yet. Pick a move to get on the board.</p>
      ) : (
        <ol className="space-y-1.5 text-sm">
          {top.map((t, i) => (
            <li key={`${t.name}-${i}`} className="flex items-baseline gap-2">
              <span className="w-6 text-right tabular-nums text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="tabular-nums text-gold">{t.points}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function SponsorCard({ sponsor }: { sponsor: NonNullable<PublicState["sponsor"]> }) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        {sponsor.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-contain" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted">Prizes from</p>
          <p className="truncate font-display text-base font-bold">{sponsor.name}</p>
        </div>
      </div>
      {sponsor.prizeText && <p className="mt-3 text-sm text-gold">{sponsor.prizeText}</p>}
    </>
  );
  return sponsor.url ? (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-xl border border-gold/40 bg-panel-hi p-4 transition-colors hover:border-gold"
    >
      {inner}
    </a>
  ) : (
    <div className="rounded-xl border border-gold/40 bg-panel-hi p-4">{inner}</div>
  );
}

export function MoveLog({ history }: { history: PublicState["history"] }) {
  return (
    <Panel title="Move log">
      {history.length === 0 ? (
        <p className="text-sm text-muted">Moves appear here after each turn.</p>
      ) : (
        <ol className="max-h-80 space-y-1 overflow-y-auto pr-1 text-sm">
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
      )}
    </Panel>
  );
}
