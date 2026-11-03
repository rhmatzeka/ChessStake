"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicState } from "@/server/events";
import type { AuthUser, MyState } from "@/hooks/useMyState";
import { formatCountdown, remainingMs } from "@/lib/time";
import { buildIcsDataUrl } from "@/lib/ics";
import { formatWib } from "@/components/site/EventCard";
import { Sprite } from "@/components/site/Sprite";
import { Panel } from "./SidePanel";

export function RulesSummary() {
  return (
    <Panel title="How it works">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
        <li>The crowd plays White against an AI Boss. Everyone gets the same 3 candidate moves each turn.</li>
        <li>You have 15 seconds to tap the move you like. The most-picked move is played.</li>
        <li>The Boss answers. Then you see how good each of the 3 moves was.</li>
        <li>Better picks earn more points. Sponsors give prizes to the top players. Playing is free.</li>
      </ol>
    </Panel>
  );
}

export function ScheduledCard({ state, serverNow }: { state: PublicState; serverNow: number | null }) {
  const left = serverNow === null ? null : remainingMs(Date.parse(state.startsAt), serverNow, 0, 0);
  // Built after mount: it needs this site's address and a timestamp, which would not match the server render.
  const [ics, setIcs] = useState<string | undefined>(undefined);
  useEffect(() => {
    setIcs(buildIcsDataUrl({ slug: state.slug, title: state.title, startsAt: state.startsAt, url: `${window.location.origin}/events/${state.slug}` }));
  }, [state.slug, state.title, state.startsAt]);
  return (
    <div className="panel p-5">
      <p className="kicker kicker-muted">Starts {formatWib(state.startsAt)}</p>
      <p className="mt-2 display text-5xl tabular-nums text-gold" aria-live="off">
        {left === null ? "-" : left <= 0 ? "Starting now" : formatCountdown(left)}
      </p>
      <p className="mt-3 text-muted">The board opens when the event starts. This page updates by itself.</p>
      <a
        href={ics}
        download={`${state.slug}.ics`}
        className="btn btn-glass btn-sm mt-5"
      >
        Add to calendar
      </a>
    </div>
  );
}

const RESULT_COPY: Record<string, { title: string; text: string }> = {
  WIN: { title: "The crowd beat the Boss", text: "Checkmate. Nice teamwork." },
  SURVIVED: { title: "The crowd survived", text: "The Boss ran out of moves to win." },
  LOST: { title: "The Boss won", text: "The Boss got the crowd this time." },
};

export function ResultCard({ state, user, me }: { state: PublicState; user: AuthUser | null | undefined; me: MyState | null }) {
  const [note, setNote] = useState<string | null>(null);
  const copy =
    state.status === "ABANDONED"
      ? { title: "Event ended early", text: "This event was stopped before the game finished." }
      : RESULT_COPY[state.result ?? ""] ?? { title: "Event finished", text: "" };

  async function share() {
    const url = window.location.href;
    const text = `${copy.title}. Play PawnPool with the crowd.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: state.title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Link copied");
    } catch {
      /* the share sheet was dismissed */
    }
  }

  return (
    <div className="panel panel-gold p-5">
      <Sprite piece={state.result === "LOST" ? "king" : "queen"} side={state.result === "LOST" ? "Black" : "White"} size={56} />
      <h2 className="display display-md mt-3">{copy.title}</h2>
      <p className="mt-1 text-muted">{copy.text}</p>
      {user && me && (
        <p className="mt-4 text-lg">
          You scored <span className="font-bold text-gold">{me.points}</span> points
          {me.rank ? (
            <>
              {" "}
              and finished <span className="font-bold text-gold">#{me.rank}</span>
            </>
          ) : null}
          .
        </p>
      )}
      {state.isPractice && <p className="mt-3 text-sm text-muted">Next practice round starts in a moment.</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={share} className="btn btn-gold btn-sm">
          Share
        </button>
        <Link href="/events" className="btn btn-glass btn-sm">
          See more events
        </Link>
        <span role="status" className="text-sm text-muted">
          {note}
        </span>
      </div>
    </div>
  );
}
