import { describe, expect, it } from "vitest";
import { checkerCells, countAt, CHECKER_COLS } from "./motion";

describe("checkerCells", () => {
  it("makes rows x cols cells in a checker pattern", () => {
    const cells = checkerCells(8, 40);
    expect(cells).toHaveLength(8 * CHECKER_COLS);
    expect(cells[0].dark).toBe(false);
    expect(cells[1].dark).toBe(true);
    expect(cells[CHECKER_COLS].dark).toBe(true);
  });

  it("opens from the bottom center first and the top corners last", () => {
    const cells = checkerCells(8, 40);
    const delays = cells.map((c) => c.delay);
    const bottomCenter = cells[7 * CHECKER_COLS + CHECKER_COLS / 2].delay;
    expect(bottomCenter).toBe(Math.min(...delays));
    expect(bottomCenter).toBe(0);
    expect(cells[0].delay).toBe(Math.max(...delays));
  });

  it("is symmetric left to right", () => {
    const cells = checkerCells(4, 30);
    for (let r = 0; r < 4; r++) {
      const row = cells.slice(r * CHECKER_COLS, (r + 1) * CHECKER_COLS).map((c) => c.delay);
      expect(row).toEqual([...row].reverse());
    }
  });
});

describe("countAt", () => {
  it("starts at 0, rises, and lands exactly on the target", () => {
    expect(countAt(3_000_000, 0, 1000)).toBe(0);
    const mid = countAt(3_000_000, 500, 1000);
    expect(mid).toBeGreaterThan(1_500_000);
    expect(mid).toBeLessThan(3_000_000);
    expect(countAt(3_000_000, 1000, 1000)).toBe(3_000_000);
    expect(countAt(58, 5000, 1000)).toBe(58);
  });
});
