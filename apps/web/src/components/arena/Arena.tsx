"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicState } from "@/server/events";
import { ApiError, apiFetch } from "@/lib/api";
import { turnClock, useEventState, useServerNow } from "@/hooks/useEventState";
import { useAuthUser, useMyState } from "@/hooks/useMyState";
import { usePresentation } from "@/hooks/usePresentation";
import { Sprite } from "@/components/site/Sprite";
import { Board, type BoardArrow } from "./Board";
import { CandidateCards, RevealCards } from "./CandidateCards";
import { CANDIDATE_COLORS } from "./geometry";
import { ResultCard, RulesSummary, ScheduledCard } from "./Screens";
import { MeCard, MoveLog, SponsorCard, TopList } from "./SidePanel";
import { TurnBar } from "./TurnBar";

const ERRORS: Record<string, string> = {
  TURN_CLOSED: "Too late, this turn just ended",
  TURN_NOT_OPEN_YET: "This turn has not opened yet",
  EVENT_NOT_LIVE: "This event is not live right now",
  RATE_LIMITED: "Slow down a little",
  NOT_A_CANDIDATE: "That move is not one of the 3 choices",
};

export function Arena({ slug, initial }: { slug: string; initial: PublicState }) {
  const { snap, offline } = useEventState(slug, initial);
  const state = snap.state;
  const serverNow = useServerNow(snap);
  const clock = turnClock(snap, serverNow);
  const { user, setUser } = useAuthUser();
  const { me, refresh } = useMyState(slug, !!user);
  const { frame, thinkingBeat, reveal } = usePresentation(state);

  const [local, setLocal] = useState<{ turn: number; uci: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [openSignal, setOpenSignal] = useState(0);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const turn = state.turn;
  const live = state.status === "LIVE";
  const thinking = live && (thinkingBeat || (!!clock && clock.pastEnd));
  const canPick = live && !!clock?.isOpen && !thinkingBeat;
  const pick = turn ? (local?.turn === turn.number ? local.uci : me?.pickUci ?? null) : null;

  const flash = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(messageTimer.current), []);

  async function onPick(uci: string) {
    if (!turn) return;
    if (!user) {
      setOpenSignal((n) => n + 1);
      return;
    }
    if (!canPick) {
      flash(clock?.pastEnd ? ERRORS.TURN_CLOSED! : ERRORS.TURN_NOT_OPEN_YET!);
      return;
    }
    const before = local;
    setLocal({ turn: turn.number, uci });
    try {
      await apiFetch(`/api/events/${encodeURIComponent(slug)}/picks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnNumber: turn.number, uci }),
      });
      void refresh().catch(() => {});
    } catch (e) {
      setLocal(before);
      if (e instanceof ApiError && e.code === "UNAUTHENTICATED") {
        setUser(null);
        setOpenSignal((n) => n + 1);
        return;
      }
      flash(e instanceof ApiError ? ERRORS[e.code] ?? e.message : "Could not send your pick. Check your connection.");
    }
  }

  const arrows: BoardArrow[] =
    live && turn && !reveal
      ? turn.candidates.map((c, i) => ({
          uci: c.uci,
          color: CANDIDATE_COLORS[i % CANDIDATE_COLORS.length]!,
          state: pick === null ? "normal" : pick === c.uci ? "picked" : "dim",
        }))
      : [];

  const finished = state.status === "FINISHED" || state.status === "ABANDONED";

  return (
    <div className="mx-auto max-w-6xl px-3 pb-6 pt-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold leading-tight sm:text-3xl">{state.title}</h1>
          <p className="hidden text-sm text-muted sm:block">
            The crowd (White) vs the AI Boss, level {state.bossLevel}. Hosted by {state.hostName}.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {live && (
            <span className="flex items-center gap-2 font-medium text-gold">
              <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
              {state.isPractice ? "Practice, always open" : "Live now"}
            </span>
          )}
          <span className="text-muted">{state.playersOnline} playing</span>
        </div>
      </div>

      {offline && (
        <p role="status" className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          Reconnecting… the board may be a few seconds behind.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
        <div className="space-y-3">
          {live && <TurnBar turnNumber={turn?.number ?? null} clock={clock} thinking={thinking} note={turn ? undefined : "Setting up the next turn"} />}
          <div className="mx-auto w-full max-w-[620px]">
            <Board
              fen={frame.fen}
              lastMove={frame.lastMove}
              animate={frame.animate}
              arrows={arrows}
              onArrow={live && turn ? onPick : undefined}
            />
          </div>

          {live && !user && user !== undefined && turn && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-panel-hi px-4 py-3">
              <p className="text-sm">Sign in to pick a move. It is free and sends no transaction.</p>
              <button
                onClick={() => setOpenSignal((n) => n + 1)}
                className="shrink-0 rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#f0b868]"
              >
                Sign in
              </button>
            </div>
          )}

          <div role="status" className="min-h-0 text-sm font-medium text-amber-200">
            {message}
          </div>

          {live && reveal && <RevealCards item={reveal} bossSan={reveal.bossSan} />}
          {live && !reveal && turn && (
            <CandidateCards turn={turn} pick={pick} canPick={canPick} onPick={onPick} />
          )}
          {live && !reveal && !turn && (
            <p className="rounded-xl border border-line bg-panel px-4 py-6 text-center text-muted">
              <Sprite piece="knight" size={36} className="mx-auto mb-2" />
              Setting up the next turn…
            </p>
          )}
          {state.status === "SCHEDULED" && <ScheduledCard state={state} serverNow={serverNow} />}
        </div>

        <aside className="space-y-4">
          {finished && <ResultCard state={state} user={user} me={me} />}
          {state.status === "SCHEDULED" && <RulesSummary />}
          <MeCard user={user} onUser={setUser} openSignal={openSignal} me={me} />
          {state.sponsor && <SponsorCard sponsor={state.sponsor} />}
          <TopList top={state.top} />
          <MoveLog history={state.history} />
        </aside>
      </div>
    </div>
  );
}
