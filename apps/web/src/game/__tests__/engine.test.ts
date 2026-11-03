import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { analyse, bossMove, BOSS_LEVELS, engineStats } from "../engine";
import { analyseFallback, bossMoveFallback } from "../engine-fallback";
import { INITIAL_FEN, type BossLevel } from "../types";

const MATE_IN_ONE = "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1";
const T = 15_000;

const legalUci = (fen: string) =>
  new Chess(fen).moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ""));

describe("engine", () => {
  it("finds mate in one", async () => {
    const lines = await analyse(MATE_IN_ONE, { lines: 3, budgetMs: 300 });
    expect(lines[0].uci).toBe("d1d8");
    expect(lines[0].cp).toBe(1000);
  }, T);

  it("returns at most N lines, all legal, best first", async () => {
    const lines = await analyse(INITIAL_FEN, { lines: 5, budgetMs: 300 });
    expect(lines).toHaveLength(5);
    const legal = legalUci(INITIAL_FEN);
    for (const l of lines) expect(legal).toContain(l.uci);
    expect(new Set(lines.map((l) => l.uci)).size).toBe(5);
    for (let i = 1; i < lines.length; i++) expect(lines[i - 1].cp).toBeGreaterThanOrEqual(lines[i].cp);
  }, T);

  it("returns every legal move when fewer exist than requested", async () => {
    const fen = "7k/8/8/8/8/5q2/8/7K w - - 0 1"; // in check, few legal replies
    const legal = legalUci(fen);
    const lines = await analyse(fen, { lines: 8, budgetMs: 200 });
    expect(lines.map((l) => l.uci).sort()).toEqual([...legal].sort());
  }, T);

  it("returns [] when there are no legal moves", async () => {
    const mated = "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1";
    expect(await analyse(mated, { lines: 3, budgetMs: 200 })).toEqual([]);
  }, T);

  it("bossMove returns a legal move for every level", async () => {
    const legal = legalUci(INITIAL_FEN);
    for (const level of [1, 2, 3, 4, 5] as BossLevel[]) {
      expect(BOSS_LEVELS[level]).toBeDefined();
      expect(legal).toContain(await bossMove(INITIAL_FEN, level));
    }
  }, T);

  it("serialises concurrent calls", async () => {
    const [a, b] = await Promise.all([
      analyse(MATE_IN_ONE, { lines: 2, budgetMs: 200 }),
      analyse(INITIAL_FEN, { lines: 2, budgetMs: 200 }),
    ]);
    expect(a[0].uci).toBe("d1d8");
    expect(legalUci(INITIAL_FEN)).toContain(b[0].uci);
  }, T);
});

it("used Stockfish, never the fallback", () => {
  expect(engineStats.stockfish).toBeGreaterThan(0);
  expect(engineStats.fallback).toBe(0);
});

describe("engine-fallback", () => {
  it("fallback engine finds mate in one", async () => {
    const lines = await analyseFallback(MATE_IN_ONE, { lines: 3, budgetMs: 300 });
    expect(lines[0].uci).toBe("d1d8");
    expect(lines[0].cp).toBe(1000);
  }, T);

  it("fallback bossMove is legal", async () => {
    expect(legalUci(INITIAL_FEN)).toContain(await bossMoveFallback(INITIAL_FEN, 3));
  }, T);
});
