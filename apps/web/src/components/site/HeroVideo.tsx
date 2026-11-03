"use client";

import { useEffect, useRef, useState } from "react";

type Conn = { saveData?: boolean };

/**
 * Short muted loop of the pieces exploding onto the board. It is only fetched and started once the page
 * has loaded and the browser is idle, and never for reduced motion or data saver. The video stays invisible
 * until it is really playing, so the still photo underneath (the LCP image) is the poster.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || conn?.saveData) return;

    let cancelled = false;
    let started = false;
    let inView = true;
    let idle = 0;
    let timer = 0;
    const sync = () => {
      if (!started) return;
      if (inView && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    const start = () => {
      if (cancelled) return;
      started = true;
      v.preload = "auto";
      sync();
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 4000 });
      else timer = window.setTimeout(start, 2000) as unknown as number;
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      sync();
    });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("load", schedule);
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      clearTimeout(timer);
      v.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      className="hero-video absolute inset-0 h-full w-full object-cover"
      data-playing={playing}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
    >
      <source src="/assets/hero/explosion.webm" type="video/webm" />
      <source src="/assets/hero/explosion.mp4" type="video/mp4" />
    </video>
  );
}
