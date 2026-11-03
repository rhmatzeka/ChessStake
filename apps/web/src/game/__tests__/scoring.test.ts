import { describe, expect, it } from "vitest";
import { eventBonus, isPrizeEligible, pickPoints } from "../scoring";

describe("pickPoints", () => {
  it("scores by cp loss, floor 10", () => {
    expect(pickPoints(0)).toBe(110);
    expect(pickPoints(150)).toBe(60);
    expect(pickPoints(300)).toBe(10);
    expect(pickPoints(5000)).toBe(10);
  });
});

describe("eventBonus", () => {
  it("pays only with at least 5 turns picked", () => {
    expect(eventBonus("WIN", 5)).toBe(500);
    expect(eventBonus("SURVIVED", 5)).toBe(200);
    expect(eventBonus("LOST", 9)).toBe(0);
    expect(eventBonus("WIN", 4)).toBe(0);
  });
});

describe("isPrizeEligible", () => {
  it("needs 10 turns and no disqualification", () => {
    expect(isPrizeEligible(10, false)).toBe(true);
    expect(isPrizeEligible(9, false)).toBe(false);
    expect(isPrizeEligible(20, true)).toBe(false);
  });
});
