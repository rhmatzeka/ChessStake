import Link from "next/link";
import type { LobbyItem } from "@/server/events";
import { Countdown } from "./Countdown";
import { Sprite } from "./Sprite";

export function formatWib(iso: string): string {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return `${s} WIB`;
}

const RESULT: Record<string, string> = {
  WIN: "The crowd won",
  SURVIVED: "The crowd survived",
  LOST: "The Boss won",
};

export function EventCard({ e }: { e: LobbyItem }) {
  const live = e.status === "LIVE";
  const upcoming = e.status === "SCHEDULED";
  const label = live ? (e.isPractice ? "Always open" : "Live now") : upcoming ? formatWib(e.startsAt) : e.status === "ABANDONED" ? "Ended early" : RESULT[e.result ?? ""] ?? "Finished";
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 transition-colors hover:border-gold/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug">{e.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            Hosted by {e.hostName}
            {e.sponsorName ? `, prizes from ${e.sponsorName}` : ""}
          </p>
        </div>
        <Sprite piece="king" side="Black" size={40} className="shrink-0 opacity-80 group-hover:opacity-100" />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className={live ? "font-medium text-gold" : "text-foreground"}>
          {live && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold align-middle" />}
          {label}
        </span>
        <span className="text-muted">Boss level {e.bossLevel}</span>
        {!e.isPractice && <span className="text-muted">{e.playersCount} players</span>}
        {upcoming && (
          <span className="text-gold">
            starts in <Countdown target={Date.parse(e.startsAt)} />
          </span>
        )}
      </div>
      {e.top3.length > 0 && (
        <ol className="grid gap-1 border-t border-line pt-3 text-sm">
          {e.top3.map((p, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="truncate">
                <span className="mr-2 text-gold">{i + 1}</span>
                {p.name}
              </span>
              <span className="tabular-nums text-muted">{p.points} pts</span>
            </li>
          ))}
        </ol>
      )}
    </Link>
  );
}
