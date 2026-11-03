import { describe, expect, it } from "vitest";
import { applyMove, bossGameOver, choosePlayedMove, crowdGameOver, nextStatusAfterTurn } from "../rules";
import type { Candidate } from "../types";

const cand = (uci: string, cpLoss: number, quality: Candidate["quality"]): Candidate => ({
  uci, san: uci, label: uci, evalCp: -cpLoss, cpLoss, quality,
});
const cands = [cand("e2e4", 0, "best"), cand("d2d4", 60, "okay"), cand("a2a3", 300, "blunder")];

describe("choosePlayedMove", () => {
  it("most picks wins", () => {
    const r = choosePlayedMove(cands, [
      { uci: "e2e4", count: 2, firstAt: 1 },
      { uci: "a2a3", count: 5, firstAt: 2 },
    ]);
    expect(r).toEqual({ uci: "a2a3", zeroPick: false });
  });
  it("tie goes to earliest firstAt", () => {
    const r = choosePlayedMove(cands, [
      { uci: "e2e4", count: 3, firstAt: 20 },
      { uci: "d2d4", count: 3, firstAt: 10 },
    ]);
    expect(r.uci).toBe("d2d4");
  });
  it("zero picks plays okay candidate", () => {
    expect(choosePlayedMove(cands, [])).toEqual({ uci: "d2d4", zeroPick: true });
  });
  it("zero picks without okay plays median cp loss; single candidate plays itself", () => {
    const two = [cand("a", 0, "best"), cand("b", 10, "best"), cand("c", 400, "blunder")];
    expect(choosePlayedMove(two, []).uci).toBe("b");
    expect(choosePlayedMove([cand("x", 0, "best")], []).uci).toBe("x");
  });
  it("ignores tally entries that are not candidates", () => {
    const r = choosePlayedMove(cands, [{ uci: "h2h4", count: 9, firstAt: 1 }]);
    expect(r).toEqual({ uci: "d2d4", zeroPick: true });
  });
});

describe("game over checks", () => {
  it("applyMove plays legal moves and throws on illegal", () => {
    const r = applyMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e4");
    expect(r.san).toBe("e4");
    expect(() => applyMove(r.fen, "e2e4")).toThrow("ILLEGAL_MOVE");
  });
  it("applyMove supports promotion", () => {
    expect(applyMove("8/P6k/8/8/8/8/8/K7 w - - 0 1", "a7a8q").san).toBe("a8=Q");
  });
  it("crowd mate ends event as WIN without boss reply", () => {
    const { fen } = applyMove("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7");
    expect(crowdGameOver(fen)).toBe("WIN");
  });
  it("crowd move leaving Boss stalemated is SURVIVED; ordinary is null", () => {
    expect(crowdGameOver("7k/5Q2/8/6K1/8/8/8/8 b - - 0 1")).toBe("SURVIVED");
    expect(crowdGameOver("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1")).toBeNull();
  });
  it("boss mate ends event as LOST", () => {
    const start = applyMove(applyMove(applyMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "f2f3").fen, "e7e5").fen, "g2g4").fen;
    const { fen } = applyMove(start, "d8h4");
    expect(bossGameOver(fen)).toBe("LOST");
  });
  it("draw by rule is SURVIVED", () => {
    expect(bossGameOver("8/8/8/4k3/8/8/4K3/8 w - - 0 1")).toBe("SURVIVED");
    expect(crowdGameOver("8/8/8/4k3/8/8/4K3/8 b - - 0 1")).toBe("SURVIVED");
    expect(bossGameOver("8/8/8/4k3/8/8/4K3/7R w - - 100 80")).toBe("SURVIVED");
    expect(bossGameOver("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1")).toBeNull();
  });
});

describe("nextStatusAfterTurn", () => {
  const base = { ended: null, crowdMoveNumber: 3, maxCrowdMoves: 30, emptyStreak: 0 };
  it("ended result wins first", () => {
    expect(nextStatusAfterTurn({ ...base, ended: "WIN", crowdMoveNumber: 30, emptyStreak: 9 })).toEqual({ status: "FINISHED", result: "WIN" });
  });
  it("reaching maxCrowdMoves is SURVIVED", () => {
    expect(nextStatusAfterTurn({ ...base, crowdMoveNumber: 30 })).toEqual({ status: "FINISHED", result: "SURVIVED" });
  });
  it("5 empty turns is ABANDONED, 4 is LIVE", () => {
    expect(nextStatusAfterTurn({ ...base, emptyStreak: 5 })).toEqual({ status: "ABANDONED", result: null });
    expect(nextStatusAfterTurn({ ...base, emptyStreak: 4 })).toEqual({ status: "LIVE", result: null });
  });
});
