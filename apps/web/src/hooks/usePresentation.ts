"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import type { PublicState } from "@/server/events";

type Frame = { fen: string; lastMove: PublicState["lastMove"]; animate: boolean };
type HistoryItem = PublicState["history"][number];

const BOSS_BEAT_MS = 1600;
const REVEAL_MS = 2200;

/**
 * Turns server snapshots into what the screen shows. When a turn resolves we first show the crowd's move,
 * hold for the Boss "thinking" beat, then slide the Boss reply in. The previous turn's candidates are shown
 * with their quality for a couple of seconds. The very first snapshot is never animated.
 */
export function usePresentation(state: PublicState): {
  frame: Frame;
  thinkingBeat: boolean;
  reveal: HistoryItem | null;
} {
  const [frame, setFrame] = useState<Frame>({ fen: state.fen, lastMove: state.lastMove, animate: false });
  const [thinkingBeat, setThinkingBeat] = useState(false);
  const [reveal, setReveal] = useState<HistoryItem | null>(null);
  const prev = useRef<{ slug: string; fen: string; top: number | null }>({
    slug: state.slug,
    fen: state.fen,
    top: state.history[0]?.number ?? null,
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const p = prev.current;
    const top = state.history[0] ?? null;
    if (state.slug !== p.slug) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      prev.current = { slug: state.slug, fen: state.fen, top: top?.number ?? null };
      setFrame({ fen: state.fen, lastMove: state.lastMove, animate: false });
      setThinkingBeat(false);
      setReveal(null);
      return;
    }
    if (state.fen === p.fen && (top?.number ?? null) === p.top) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const newTurn = top !== null && top.number !== p.top && p.top !== null;
    if (newTurn && top) {
      setReveal(top);
      timers.current.push(setTimeout(() => setReveal(null), REVEAL_MS));
    }

    let mid: Frame | null = null;
    if (state.lastMove?.by === "boss" && top?.crowdSan && state.fen !== p.fen) {
      try {
        const c = new Chess(p.fen);
        const m = c.move(top.crowdSan);
        mid = { fen: c.fen(), lastMove: { uci: m.from + m.to + (m.promotion ?? ""), san: m.san, by: "crowd" }, animate: true };
      } catch {
        mid = null;
      }
    }
    if (mid && mid.fen !== state.fen) {
      setFrame(mid);
      setThinkingBeat(true);
      timers.current.push(
        setTimeout(() => {
          setThinkingBeat(false);
          setFrame({ fen: state.fen, lastMove: state.lastMove, animate: true });
        }, BOSS_BEAT_MS),
      );
    } else {
      setThinkingBeat(false);
      setFrame({ fen: state.fen, lastMove: state.lastMove, animate: state.fen !== p.fen });
    }
    prev.current = { slug: state.slug, fen: state.fen, top: top?.number ?? null };
  }, [state]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  return { frame, thinkingBeat, reveal };
}
