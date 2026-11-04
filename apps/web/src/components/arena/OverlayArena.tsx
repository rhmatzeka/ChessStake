"use client";

import type { PublicState } from "@/server/events";
import { turnClock, useEventState, useServerNow } from "@/hooks/useEventState";
import { usePresentation } from "@/hooks/usePresentation";
import { Board, type BoardArrow } from "./Board";
import { CandidateCards, RevealCards } from "./CandidateCards";
import { candidateLetter } from "./geometry";
import { TurnBar } from "./TurnBar";

/** Stream overlay: board, the 3 cards, timer and live counts on a transparent background. No sign-in. */
export function OverlayArena({ slug, initial }: { slug: string; initial: PublicState }) {
  const { snap } = useEventState(slug, initial);
  const state = snap.state;
  const clock = turnClock(snap, useServerNow(snap));
  const { frame, thinkingBeat, reveal } = usePresentation(state);
  const turn = state.turn;
  const live = state.status === "LIVE";
  const thinking = live && (thinkingBeat || (!!clock && clock.pastEnd));
  const arrows: BoardArrow[] =
    live && turn && !reveal
      ? turn.candidates.map((c, i) => ({ uci: c.uci, letter: candidateLetter(i), state: "normal" }))
      : [];
  const ended = state.status === "FINISHED" || state.status === "ABANDONED";
  const headline =
    state.status === "SCHEDULED"
      ? "Starting soon"
      : state.status === "ABANDONED"
        ? "Event ended early"
        : state.result === "WIN"
          ? "The crowd beat the Boss"
          : state.result === "SURVIVED"
            ? "The crowd survived"
            : state.result === "LOST"
              ? "The Boss won"
              : null;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col items-stretch gap-3 p-3 min-[900px]:flex-row min-[900px]:items-start">
      <div className="w-full min-[900px]:w-[min(60vh,620px)] min-[900px]:shrink-0">
        <div className="rounded-2xl bg-black/35 p-2 backdrop-blur-[2px]">
          <Board fen={frame.fen} lastMove={frame.lastMove} animate={frame.animate} arrows={arrows} />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-3 rounded-2xl bg-black/35 p-3 backdrop-blur-[2px]">
        <p className="display display-xs leading-tight">{state.title}</p>
        {live && <TurnBar turnNumber={turn?.number ?? null} clock={clock} thinking={thinking} note={turn ? undefined : "Setting up the next turn"} />}
        {live && reveal && <RevealCards item={reveal} bossSan={reveal.bossSan} />}
        {live && !reveal && turn && <CandidateCards turn={turn} pick={null} canPick={false} onPick={() => {}} interactive={false} />}
        {(ended || state.status === "SCHEDULED") && headline && <p className="display text-3xl">{headline}</p>}
        <p className="text-sm text-muted">Pick your move on PawnPool. Free to play. {state.playersOnline} playing</p>
      </div>
    </div>
  );
}
