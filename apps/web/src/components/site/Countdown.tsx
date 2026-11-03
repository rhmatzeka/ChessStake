"use client";

import { useEffect, useState } from "react";
import { formatCountdown, remainingMs } from "@/lib/time";

/**
 * Ticks down to `target` (epoch ms). The page may be a cached (ISR) render, so the offset is taken
 * from this device's clock at mount; for a countdown of minutes to days that is accurate enough.
 */
export function Countdown({ target }: { target: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const t0 = Date.now();
    const tick = () => setLeft(remainingMs(target, t0, t0, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <span suppressHydrationWarning aria-live="off" className="tabular-nums">
      {left === null ? " " : left <= 0 ? "Starting now" : formatCountdown(left)}
    </span>
  );
}
