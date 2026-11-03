import { Chess, type Move } from "chess.js";
import type { BossLevel, EngineLine } from "./types";

// Pure-JS alpha-beta (material + piece-square tables). Used when Stockfish cannot load or times out.

const MATE = 100000;
const CLAMP = 1000;
const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Simplified evaluation function tables, written from White's view, rank 8 first.
const PST: Record<string, number[]> = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

const uciOf = (m: Move) => m.from + m.to + (m.promotion ?? "");

/** Static eval from the side to move's view. */
function evaluate(chess: Chess): number {
  let score = 0; // White's view
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (!sq) continue;
      const idx = sq.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const v = VALUE[sq.type] + PST[sq.type][idx];
      score += sq.color === "w" ? v : -v;
    }
  }
  return chess.turn() === "w" ? score : -score;
}

function ordered(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true });
  const key = (m: Move) =>
    (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] : 0) + (m.promotion ? 800 : 0);
  return moves.sort((a, b) => key(b) - key(a));
}

function search(chess: Chess, depth: number, alpha: number, beta: number, ply: number): number {
  if (chess.isCheckmate()) return -MATE + ply;
  if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) return 0;
  if (depth === 0) return evaluate(chess);
  for (const m of ordered(chess)) {
    chess.move(m);
    const score = -search(chess, depth - 1, -beta, -alpha, ply + 1);
    chess.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

const toCp = (s: number) => Math.max(-CLAMP, Math.min(CLAMP, s));

/** Score every legal move at the given depth (>=1). Sorted best first. */
function scoreRoot(fen: string, depth: number): EngineLine[] {
  const chess = new Chess(fen);
  const out: EngineLine[] = [];
  for (const m of ordered(chess)) {
    chess.move(m);
    const s = -search(chess, depth - 1, -MATE * 2, MATE * 2, 1);
    chess.undo();
    out.push({ uci: uciOf(m), cp: s });
  }
  out.sort((a, b) => b.cp - a.cp);
  return out;
}

export async function analyseFallback(
  fen: string,
  opts: { lines: number; budgetMs: number },
): Promise<EngineLine[]> {
  return scoreRoot(fen, 3)
    .slice(0, Math.max(0, opts.lines))
    .map((l) => ({ uci: l.uci, cp: toCp(l.cp) }));
}

const FALLBACK_DEPTH: Record<BossLevel, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 };

export async function bossMoveFallback(fen: string, level: BossLevel): Promise<string> {
  const scored = scoreRoot(fen, FALLBACK_DEPTH[level]);
  if (scored.length === 0) throw new Error("no legal moves");
  // Weak levels pick randomly among the top few so they stay beatable.
  const pool = level <= 2 ? scored.slice(0, level === 1 ? 5 : 3) : scored.slice(0, 1);
  return pool[Math.floor(Math.random() * pool.length)].uci;
}
