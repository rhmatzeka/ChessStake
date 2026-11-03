import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { qualityOf, selectCandidates } from "../candidates";
import { INITIAL_FEN, type EngineLine } from "../types";

const linesFor = (fen: string, cps: number[]): EngineLine[] =>
  new Chess(fen).moves({ verbose: true }).slice(0, cps.length).map((m, i) => ({
    uci: m.from + m.to + (m.promotion ?? ""),
    cp: cps[i]!,
  }));

describe("selectCandidates", () => {
  const lines = linesFor(INITIAL_FEN, [50, 45, 30, 0, -40, -200, -300]);

  it("includes best, an okay (40-149 loss), and a blunder", () => {
    const c = selectCandidates(INITIAL_FEN, lines, "s");
    expect(c).toHaveLength(3);
    expect(c.find((x) => x.cpLoss === 0)?.uci).toBe(lines[0]!.uci);
    const okay = c.find((x) => x.quality === "okay")!;
    expect(okay.cpLoss).toBeGreaterThanOrEqual(40);
    expect(okay.cpLoss).toBeLessThan(150);
    expect(c.some((x) => x.quality === "blunder" && x.cpLoss >= 150)).toBe(true);
  });

  it("quality always matches the real loss; evalCp is the line cp", () => {
    for (const x of selectCandidates(INITIAL_FEN, lines, "s")) {
      expect(x.quality).toBe(qualityOf(x.cpLoss));
      expect(x.evalCp).toBe(lines.find((l) => l.uci === x.uci)!.cp);
    }
  });

  it("trap prefers a capture/check over a quieter weak move", () => {
    const fen = "4k3/8/8/3n4/8/8/3R4/4K3 w - - 0 1";
    const ls: EngineLine[] = [
      { uci: "d2d5", cp: 300 },
      { uci: "d2d3", cp: 280 },
      { uci: "e1e2", cp: 200 },
      { uci: "e1f1", cp: 0 },
      { uci: "d2d1", cp: -50 },
    ];
    // d2d5 is best (capture); the trap must be a tempting move if any exist with >=150 loss
    const c = selectCandidates(fen, ls, "x");
    expect(c.find((x) => x.uci === "d2d5")).toBeDefined();
    const trap = c.find((x) => x.quality === "blunder")!;
    expect(trap.cpLoss).toBeGreaterThanOrEqual(150);
  });

  it("trap prefers capture when available", () => {
    const fen = "4k3/8/8/3n4/8/8/3R4/4K3 w - - 0 1";
    const ls: EngineLine[] = [
      { uci: "e1f1", cp: 300 },
      { uci: "e1e2", cp: 280 },
      { uci: "d2d3", cp: 250 },
      { uci: "d2d5", cp: 0 }, // capture, 300 loss
      { uci: "d2d1", cp: -100 }, // quiet, 400 loss (weaker)
    ];
    const c = selectCandidates(fen, ls, "x");
    expect(c.map((x) => x.uci)).toContain("d2d5");
    expect(c.map((x) => x.uci)).not.toContain("d2d1");
  });

  it("no band line: takes next weakest and labels truthfully", () => {
    const ls = linesFor(INITIAL_FEN, [10, 5, 0, -5]);
    const c = selectCandidates(INITIAL_FEN, ls, "s");
    expect(c).toHaveLength(3);
    for (const x of c) expect(x.quality).toBe(qualityOf(x.cpLoss));
    expect(c.every((x) => x.quality === "best")).toBe(true);
  });

  it("1 or 2 lines give 1 or 2 candidates, no duplicates", () => {
    expect(selectCandidates(INITIAL_FEN, linesFor(INITIAL_FEN, [10]), "s")).toHaveLength(1);
    const two = selectCandidates(INITIAL_FEN, linesFor(INITIAL_FEN, [10, -300]), "s");
    expect(two).toHaveLength(2);
    expect(new Set(two.map((x) => x.uci)).size).toBe(2);
    expect(selectCandidates(INITIAL_FEN, [], "s")).toEqual([]);
  });

  it("same seed same order; seeds can differ", () => {
    const a = selectCandidates(INITIAL_FEN, lines, "seed-1").map((x) => x.uci);
    expect(selectCandidates(INITIAL_FEN, lines, "seed-1").map((x) => x.uci)).toEqual(a);
    const orders = new Set(
      Array.from({ length: 20 }, (_, i) =>
        selectCandidates(INITIAL_FEN, lines, `s${i}`).map((x) => x.uci).join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("labels and keeps promotion candidates", () => {
    const fen = "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1";
    const ls: EngineLine[] = [
      { uci: "e7e8q", cp: 900 },
      { uci: "e7e8r", cp: 700 },
      { uci: "e7e8n", cp: 300 },
    ];
    const c = selectCandidates(fen, ls, "p");
    const q = c.find((x) => x.uci === "e7e8q")!;
    expect(q.san).toBe("e8=Q");
    expect(q.label).toBe("Promote to a queen");
  });
});
