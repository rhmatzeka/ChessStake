"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicState } from "@/server/events";
import { apiFetch } from "@/lib/api";
import { remainingMs } from "@/lib/time";
import { useVisiblePolling } from "./useVisiblePolling";

export type Snapshot = { state: PublicState; fetchedAt: number | null };

/** Polls /state every second while the tab is visible. `fetchedAt` is the device clock when it arrived (null until mounted). */
export function useEventState(slug: string, initial: PublicState): { snap: Snapshot; offline: boolean } {
  const [snap, setSnap] = useState<Snapshot>({ state: initial, fetchedAt: null });
  const [fails, setFails] = useState(0);

  useEffect(() => {
    setSnap((s) => (s.fetchedAt === null ? { state: s.state, fetchedAt: Date.now() } : s));
  }, []);

  const tick = useCallback(async () => {
    try {
      const state = await apiFetch<PublicState>(`/api/events/${encodeURIComponent(slug)}/state`);
      const at = Date.now();
      setFails(0);
      setSnap((cur) =>
        // The CDN may hand out an older copy than one we already have; never go back in time.
        cur.state.slug === state.slug && Date.parse(state.serverNow) < Date.parse(cur.state.serverNow)
          ? cur
          : { state, fetchedAt: at },
      );
    } catch (e) {
      setFails((n) => n + 1);
      throw e;
    }
  }, [slug]);

  useVisiblePolling(tick, 1000);
  return { snap, offline: fails >= 3 };
}

/** The server's idea of "now", in ms: serverNow from the last fetch plus the time elapsed on this device. null before mount. */
export function useServerNow(snap: Snapshot, intervalMs = 250): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    setNow(Date.now());
    return () => clearInterval(id);
  }, [intervalMs]);
  if (now === null || snap.fetchedAt === null) return null;
  return Date.parse(snap.state.serverNow) + (now - snap.fetchedAt);
}

export type TurnClock = {
  /** ms until the turn opens (0 when open) */
  untilOpen: number;
  /** ms until the turn closes */
  untilEnd: number;
  isOpen: boolean;
  pastEnd: boolean;
};

export function turnClock(snap: Snapshot, serverNowMs: number | null): TurnClock | null {
  const turn = snap.state.turn;
  if (!turn || serverNowMs === null || snap.fetchedAt === null) return null;
  const sn = Date.parse(snap.state.serverNow);
  const clientNow = snap.fetchedAt + (serverNowMs - sn);
  const untilOpen = remainingMs(Date.parse(turn.opensAt), sn, snap.fetchedAt, clientNow);
  const untilEnd = remainingMs(Date.parse(turn.endsAt), sn, snap.fetchedAt, clientNow);
  return { untilOpen, untilEnd, isOpen: untilOpen === 0 && untilEnd > 0, pastEnd: untilEnd === 0 };
}
