"use client";

import { useEffect } from "react";
import { countAt } from "@/lib/motion";

const TARGETS = "[data-reveal]:not([data-in]), [data-reveal-stagger]:not([data-in])";
const COUNT_MS = 1100;

/**
 * One IntersectionObserver for every scroll reveal on the site. It marks an element `data-in` once it
 * scrolls into view (CSS does the motion with transform/opacity only) and starts any count-ups inside.
 * A MutationObserver picks up elements from client navigations and streamed content.
 * The `rv` class on <html> (set by a tiny head script) is what hides elements before they are revealed,
 * so without JS, or with reduced motion, everything is simply visible.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("rv") || !("IntersectionObserver" in window)) {
      root.classList.add("rv-off");
      return;
    }
    (window as Window & { __rv?: boolean }).__rv = true;

    const counts = (el: Element) => {
      const nodes = [el, ...el.querySelectorAll("[data-count]")].filter((n): n is HTMLElement => n instanceof HTMLElement && n.dataset.count !== undefined);
      if (!nodes.length) return;
      const items = nodes.map((n) => {
        const target = Number(n.dataset.count);
        const fmt = new Intl.NumberFormat(n.dataset.countLocale ?? "en-US");
        const final = n.textContent ?? "";
        n.textContent = fmt.format(0);
        return { n, target, fmt, final };
      });
      const t0 = performance.now();
      const tick = (now: number) => {
        const elapsed = now - t0;
        for (const it of items) {
          it.n.textContent = elapsed >= COUNT_MS ? it.final : it.fmt.format(countAt(it.target, elapsed, COUNT_MS));
        }
        if (elapsed < COUNT_MS) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const pending = new Set<Element>();
    const reveal = (el: Element, instant: boolean) => {
      io.unobserve(el);
      pending.delete(el);
      if (instant) el.setAttribute("data-instant", "");
      else if (el.hasAttribute("data-reveal-stagger")) {
        Array.from(el.children).forEach((child, i) => (child as HTMLElement).style.setProperty("--i", String(Math.min(i, 12))));
      }
      el.setAttribute("data-in", "");
      if (!instant) counts(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) reveal(e.target, false);
        // A fast scroll or an anchor jump can skip an element entirely; never leave one hidden above the fold.
        sweep();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const sweep = () => {
      for (const el of pending) if (el.getBoundingClientRect().bottom < 0) reveal(el, true);
    };
    window.addEventListener("scrollend", sweep, { passive: true });

    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll(TARGETS).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        pending.add(el);
        io.observe(el);
      });
    };
    scan();

    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scrollend", sweep);
      cancelAnimationFrame(queued);
    };
  }, []);

  return null;
}
