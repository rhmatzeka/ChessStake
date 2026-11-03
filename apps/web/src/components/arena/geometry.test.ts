import { describe, expect, it } from "vitest";
import { arrowGeometry, parseFen, squareCenter, squareCoords } from "./geometry";
import { tallyShares } from "./tally";
import { formatEval, qualityBadge } from "./quality";
import { buildIcsDataUrl } from "@/lib/ics";
import { parseSiweMessage } from "viem/siwe";
import { buildSignInMessage, SIGN_IN_STATEMENT } from "../auth/siwe";

describe("geometry", () => {
  it("maps squares with White at the bottom", () => {
    expect(squareCoords("a1")).toEqual({ file: 0, rank: 0 });
    expect(squareCenter("a1")).toEqual({ x: 0.5, y: 7.5 });
    expect(squareCenter("h8")).toEqual({ x: 7.5, y: 0.5 });
    expect(() => squareCoords("z9")).toThrow();
  });
  it("parses a FEN", () => {
    const start = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(start).toHaveLength(32);
    expect(start.find((p) => p.sq === "e1")).toEqual({ sq: "e1", kind: "k", color: "w" });
    expect(start.find((p) => p.sq === "d8")).toEqual({ sq: "d8", kind: "q", color: "b" });
    expect(parseFen("8/8/8/8/4P3/8/8/8 w - - 0 1")).toEqual([{ sq: "e4", kind: "p", color: "w" }]);
  });
  it("builds arrows that end at the destination", () => {
    const a = arrowGeometry("e2e4");
    expect(a.shaft.x1).toBeCloseTo(4.5);
    expect(a.shaft.y1).toBeLessThan(6.5);
    expect(a.shaft.y1).toBeGreaterThan(5.5);
    expect(a.head.split(" ")).toHaveLength(3);
    expect(a.to).toEqual({ x: 4.5, y: 4.5 });
  });
});

describe("tally", () => {
  it("computes percentages in candidate order", () => {
    const { rows, total } = tallyShares([{ uci: "a" }, { uci: "b" }, { uci: "c" }], [{ uci: "b", count: 3 }, { uci: "a", count: 1 }]);
    expect(total).toBe(4);
    expect(rows.map((r) => r.pct)).toEqual([25, 75, 0]);
  });
  it("is all zero with no votes", () => {
    expect(tallyShares([{ uci: "a" }], []).rows[0]).toEqual({ uci: "a", count: 0, pct: 0 });
  });
});

describe("quality", () => {
  it("has badge text", () => {
    expect(qualityBadge("best").text).toBe("Best");
    expect(qualityBadge("okay").text).toBe("Okay");
    expect(qualityBadge("blunder").text).toBe("Blunder");
  });
  it("formats evals", () => {
    expect(formatEval(42)).toBe("+0.4");
    expect(formatEval(-120)).toBe("-1.2");
    expect(formatEval(0)).toBe("Even");
    expect(formatEval(1000)).toBe("Winning");
  });
});

describe("ics", () => {
  it("builds a calendar data URL", () => {
    const url = buildIcsDataUrl({ slug: "x", title: "Boss; Battle", startsAt: "2026-11-05T12:00:00.000Z", url: "https://e.test/events/x" });
    expect(url.startsWith("data:text/calendar;charset=utf-8,")).toBe(true);
    const text = decodeURIComponent(url.split(",")[1]!);
    expect(text).toContain("DTSTART:20261105T120000Z");
    expect(text).toContain("DTEND:20261105T124500Z");
    expect(text).toContain("SUMMARY:Boss\; Battle (PawnPool)");
  });
});

describe("siwe message", () => {
  it("builds a parseable message for this host", () => {
    const msg = buildSignInMessage({
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      chainId: 1,
      nonce: "abcdefgh12345678",
      host: "pawnpool.test",
      origin: "https://pawnpool.test",
      now: new Date("2026-11-03T00:00:00Z"),
    });
    const p = parseSiweMessage(msg);
    expect(p.domain).toBe("pawnpool.test");
    expect(p.uri).toBe("https://pawnpool.test");
    expect(p.nonce).toBe("abcdefgh12345678");
    expect(p.statement).toBe(SIGN_IN_STATEMENT);
    expect(p.chainId).toBe(1);
    expect(p.version).toBe("1");
  });
});
