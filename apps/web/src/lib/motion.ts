/** Shared, framework-free helpers for the entrance animations. */

export const CHECKER_COLS = 20;

export type CheckerCell = { key: number; dark: boolean; delay: number };

/**
 * Cells of the board that covers a hero and opens on load. Squares leave from the bottom center outwards,
 * like a board being cleared toward both players, so the order looks right at any screen width:
 * the columns are centered and whatever is cut off at the sides simply goes last.
 */
export function checkerCells(rows: number, stepMs: number, cols = CHECKER_COLS): CheckerCell[] {
  const mid = (cols - 1) / 2;
  const cells: CheckerCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fromBottom = rows - 1 - r;
      const fromCenter = Math.abs(c - mid) - 0.5;
      cells.push({ key: r * cols + c, dark: (r + c) % 2 === 1, delay: Math.round((fromCenter + fromBottom) * stepMs) });
    }
  }
  return cells;
}

/** Ease-out used by the count-up: fast at first, settles softly. */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

/** The number a count-up shows at time `elapsed` of `duration`, always ending exactly on `target`. */
export function countAt(target: number, elapsed: number, duration: number): number {
  if (elapsed >= duration) return target;
  return Math.round(target * easeOutCubic(elapsed / duration));
}
