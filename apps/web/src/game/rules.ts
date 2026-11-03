import { Chess } from "chess.js";
import type { Candidate, EventResult, EventStatus, PickTally } from "./types";

/** Picks the crowd's move: most picks, ties by earliest firstAt; zero picks falls back to a default. */
export function choosePlayedMove(
  candidates: Candidate[],
  tally: PickTally,
): { uci: string; zeroPick: boolean } {
  const valid = new Set(candidates.map((c) => c.uci));
  const entries = tally.filter((t) => valid.has(t.uci) && t.count > 0);
  if (entries.length > 0) {
    const best = entries.reduce((a, b) =>
      b.count > a.count || (b.count === a.count && b.firstAt < a.firstAt) ? b : a,
    );
    return { uci: best.uci, zeroPick: false };
  }
  const okay = candidates.find((c) => c.quality === "okay");
  if (okay) return { uci: okay.uci, zeroPick: true };
  const byLoss = [...candidates].sort((a, b) => a.cpLoss - b.cpLoss);
  return { uci: byLoss[Math.floor((byLoss.length - 1) / 2)]!.uci, zeroPick: true };
}

/** Plays one UCI move (5 chars for promotion). Throws Error('ILLEGAL_MOVE') if illegal. */
export function applyMove(fen: string, uci: string): { fen: string; san: string } {
  const chess = new Chess(fen);
  try {
    const m = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return { fen: chess.fen(), san: m.san };
  } catch {
    throw new Error("ILLEGAL_MOVE");
  }
}

/** After the crowd's move (Boss to move): Boss mated is a WIN, any draw is SURVIVED. */
export function crowdGameOver(fen: string): EventResult | null {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return "WIN";
  return chess.isDraw() || chess.isStalemate() ? "SURVIVED" : null;
}

/** After the Boss's move (crowd to move): crowd mated is LOST, any draw is SURVIVED. */
export function bossGameOver(fen: string): EventResult | null {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return "LOST";
  return chess.isDraw() || chess.isStalemate() ? "SURVIVED" : null;
}

/** Event status after a turn. crowdMoveNumber counts crowd moves played so far, including this turn. */
export function nextStatusAfterTurn(input: {
  ended: EventResult | null;
  crowdMoveNumber: number;
  maxCrowdMoves: number;
  emptyStreak: number;
}): { status: Extract<EventStatus, "LIVE" | "FINISHED" | "ABANDONED">; result: EventResult | null } {
  if (input.ended) return { status: "FINISHED", result: input.ended };
  if (input.crowdMoveNumber >= input.maxCrowdMoves) return { status: "FINISHED", result: "SURVIVED" };
  if (input.emptyStreak >= 5) return { status: "ABANDONED", result: null };
  return { status: "LIVE", result: null };
}
