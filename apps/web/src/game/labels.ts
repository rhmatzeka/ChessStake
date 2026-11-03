import { Chess } from "chess.js";

const PIECE_NAMES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const name = (p: string): string => PIECE_NAMES[p] ?? "piece";

/** Plain-language label for a move. Precedence: mate, capture, promotion, check, castle, develop, pawn push, fallback. */
export function labelMove(fen: string, uci: string): string {
  const move = new Chess(fen).move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  });
  if (move.san.endsWith("#")) return "Deliver checkmate";
  if (move.captured) return `Take the ${name(move.captured)}`;
  if (move.promotion) return `Promote to a ${name(move.promotion)}`;
  if (move.san.endsWith("+")) return "Check the king";
  if (move.flags.includes("k") || move.flags.includes("q")) return "Castle to safety";
  const backRank = move.color === "w" ? "1" : "8";
  if ((move.piece === "n" || move.piece === "b") && move.from[1] === backRank) {
    return `Develop the ${name(move.piece)}`;
  }
  if (move.piece === "p" && /[c-f]/.test(move.from[0]!)) return "Push the center pawn";
  return `Move the ${name(move.piece)}`;
}
