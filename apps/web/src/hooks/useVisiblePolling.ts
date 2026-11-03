"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `tick` now and then every `ms` while the tab is visible. Pauses when hidden and runs again at
 * once when the tab becomes visible. Ticks never overlap. Does nothing while `enabled` is false.
 */
export function useVisiblePolling(tick: () => Promise<void>, ms: number, enabled = true): void {
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let running = false;

    const schedule = () => {
      if (stopped || document.visibilityState !== "visible") return;
      timer = setTimeout(run, ms);
    };
    const run = async () => {
      if (stopped || running) return;
      running = true;
      try {
        await tickRef.current();
      } catch {
        // a failed poll is retried on the next tick
      }
      running = false;
      schedule();
    };
    const onVisibility = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") void run();
    };

    if (document.visibilityState === "visible") void run();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ms, enabled]);
}
