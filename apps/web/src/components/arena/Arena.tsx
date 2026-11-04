"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicState } from "@/server/events";
import { ApiError, apiFetch } from "@/lib/api";
import { turnClock, useEventState, useServerNow } from "@/hooks/useEventState";
import { useAuthUser, useMyState } from "@/hooks/useMyState";
import { usePresentation } from "@/hooks/usePresentation";
import { Sprite } from "@/components/site/Sprite";
import { ArenaTabs } from "./ArenaTabs";
import { Board, type BoardArrow } from "./Board";
import { CandidateCards, RevealCards } from "./CandidateCards";
import { candidateLetter } from "./geometry";
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

  // Play now lands here with play=1: open sign-in once, then clear it so the button works again.
  const wantsToPlay = useSearchParams().get("play") === "1";
  useEffect(() => {
    if (!wantsToPlay || user === undefined) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (user) flash("You are signed in. Pick a move to play.");
    else setOpenSignal((n) => n + 1);
  }, [wantsToPlay, user, flash]);

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
          letter: candidateLetter(i),
          state: pick === null ? "normal" : pick === c.uci ? "picked" : "dim",
        }))
      : [];

  const finished = state.status === "FINISHED" || state.status === "ABANDONED";

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-3 pb-6 pt-2 sm:px-5 sm:pt-3 lg:h-full lg:max-w-[max(72rem,calc(100dvh+19.5rem))] lg:pb-4">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-x-6 gap-y-1 sm:mb-3">
        <div className="min-w-0">
          <h1 className="display text-xl !leading-none sm:text-3xl">{state.title}</h1>
          <p className="mt-1 hidden truncate text-sm text-muted sm:block">
            The crowd (White) vs the AI Boss, level {state.bossLevel}. Hosted by {state.hostName}.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {live && (
            <span className="kicker hidden items-center gap-2 sm:flex">
              <span className="live-dot" aria-hidden="true" />
              {state.isPractice ? "Practice, always open" : "Live now"}
            </span>
          )}
          <span className="th">{state.playersOnline} playing</span>
        </div>
      </div>

      {offline && (
        <p role="status" className="mb-3 shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          Reconnecting… the board may be a few seconds behind.
        </p>
      )}

      <div className="grid gap-2.5 lg:min-h-0 lg:flex-1 lg:grid-cols-[min(calc(100dvh-10.2rem),calc(100%-26.5rem))_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-2">
        <div className="order-1 space-y-2 lg:col-start-2 lg:row-start-1">
          {live && <TurnBar turnNumber={turn?.number ?? null} clock={clock} thinking={thinking} note={turn ? undefined : "Setting up the next turn"} />}
          {message && (
            <div role="status" className="text-sm font-medium text-amber-200">
              {message}
            </div>
          )}
        </div>

        <div className="order-2 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:min-h-0 lg:[container-type:size]">
          <div className="mx-auto w-full max-w-[620px] lg:w-[min(100cqw,100cqh)] lg:max-w-none">
          <Board
            fen={frame.fen}
            lastMove={frame.lastMove}
            animate={frame.animate}
            arrows={arrows}
            onArrow={live && turn ? onPick : undefined}
          />
          </div>
        </div>

        <div className="order-3 lg:col-start-2 lg:row-start-2 lg:min-h-0">
          {live && reveal && <RevealCards item={reveal} bossSan={reveal.bossSan} />}
          {live && !reveal && turn && (
            <CandidateCards turn={turn} pick={pick} canPick={canPick} onPick={onPick} />
          )}
          {live && !reveal && !turn && (
            <p className="panel px-4 py-6 text-center text-muted">
              <Sprite piece="knight" size={36} className="mx-auto mb-2" />
              Setting up the next turn…
            </p>
          )}
          {state.status === "SCHEDULED" && <ScheduledCard state={state} serverNow={serverNow} />}
        </div>

        <div className="scroll-quiet order-3 flex flex-col gap-2 lg:col-start-2 lg:row-start-3 lg:min-h-0 lg:overflow-y-auto">
          {finished && <ResultCard state={state} user={user} me={me} />}
          {state.sponsor && <SponsorCard sponsor={state.sponsor} />}
          <ArenaTabs
            tabs={[
              ...(state.status === "SCHEDULED" ? [{ id: "rules", label: "How it works", content: <RulesSummary /> }] : []),
              { id: "you", label: "You", content: <MeCard user={user} onUser={setUser} openSignal={openSignal} me={me} /> },
              { id: "top", label: "Top players", content: <TopList top={state.top} /> },
              { id: "moves", label: "Moves", content: <MoveLog history={state.history} /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
