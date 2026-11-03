import { describe, expect, it } from "vitest";
import { labelMove } from "../labels";
import { qualityOf } from "../candidates";
import { INITIAL_FEN } from "../types";

describe("qualityOf", () => {
  it("bands", () => {
    expect(qualityOf(0)).toBe("best");
    expect(qualityOf(29)).toBe("best");
    expect(qualityOf(30)).toBe("okay");
    expect(qualityOf(149)).toBe("okay");
    expect(qualityOf(150)).toBe("blunder");
  });
});

describe("labelMove", () => {
  it("capture", () => {
    expect(labelMove("4k3/8/8/3n4/8/8/3R4/4K3 w - - 0 1", "d2d5")).toBe("Take the knight");
  });
  it("check", () => {
    expect(labelMove("4k3/8/8/8/8/8/3R4/4K3 w - - 0 1", "d2d8")).toBe("Check the king");
  });
  it("mate", () => {
    expect(labelMove("6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1", "a1a8")).toBe("Deliver checkmate");
  });
  it("castle", () => {
    expect(labelMove("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1")).toBe("Castle to safety");
  });
  it("promotion", () => {
    expect(labelMove("8/4P1k1/8/8/8/8/8/4K3 w - - 0 1", "e7e8q")).toBe("Promote to a queen");
    expect(labelMove("8/4P1k1/8/8/8/8/8/4K3 w - - 0 1", "e7e8n")).toBe("Promote to a knight");
  });
  it("develop", () => {
    expect(labelMove(INITIAL_FEN, "g1f3")).toBe("Develop the knight");
  });
  it("center pawn", () => {
    expect(labelMove(INITIAL_FEN, "e2e4")).toBe("Push the center pawn");
  });
  it("fallback", () => {
    expect(labelMove(INITIAL_FEN, "a2a3")).toBe("Move the pawn");
    expect(labelMove("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1e2")).toBe("Move the king");
  });
});
