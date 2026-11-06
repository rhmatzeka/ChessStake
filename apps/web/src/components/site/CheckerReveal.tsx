import type { CSSProperties } from "react";
import { checkerCells } from "@/lib/motion";

/**
 * A dark chess board laid over a hero or page head that clears itself square by square on load.
 * Pure CSS, so it plays before hydration and needs no JS. Hidden for reduced motion.
 */
export function CheckerReveal({ rows, step, className = "" }: { rows: number; step: number; className?: string }) {
  return (
    <div className={`checker ${className}`} aria-hidden="true">
      <div className="checker-grid" style={{ "--rows": rows } as CSSProperties}>
        {checkerCells(rows, step).map((c) => (
          <span key={c.key} data-dark={c.dark || undefined} style={{ animationDelay: `${c.delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
