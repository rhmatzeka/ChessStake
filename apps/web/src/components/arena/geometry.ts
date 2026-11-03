export type PieceKind = "p" | "n" | "b" | "r" | "q" | "k";
export type BoardPiece = { sq: string; kind: PieceKind; color: "w" | "b" };

const FILES = "abcdefgh";

/** Colors for the three candidate moves (arrow, card accent). Chosen to read on the brown board. */
export const CANDIDATE_COLORS = ["#2fd1b0", "#5aa9ff", "#ff6fa8"] as const;

/** a1 = {file: 0, rank: 0}. */
export function squareCoords(sq: string): { file: number; rank: number } {
  const file = FILES.indexOf(sq[0] ?? "");
  const rank = Number(sq[1]) - 1;
  if (file < 0 || !(rank >= 0 && rank <= 7)) throw new Error(`bad square: ${sq}`);
  return { file, rank };
}

/** Center of a square in board units (0..8, y grows downward, White at the bottom). */
export function squareCenter(sq: string): { x: number; y: number } {
  const { file, rank } = squareCoords(sq);
  return { x: file + 0.5, y: 7 - rank + 0.5 };
}

/** Pieces from the placement field of a FEN. */
export function parseFen(fen: string): BoardPiece[] {
  const out: BoardPiece[] = [];
  const rows = (fen.split(" ")[0] ?? "").split("/");
  rows.forEach((row, i) => {
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const lower = ch.toLowerCase() as PieceKind;
      out.push({ sq: `${FILES[file]}${8 - i}`, kind: lower, color: ch === lower ? "b" : "w" });
      file += 1;
    }
  });
  return out;
}

/** Straight arrow from the center of the origin square toward the destination, with a triangular head. */
export function arrowGeometry(uci: string): {
  shaft: { x1: number; y1: number; x2: number; y2: number };
  head: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
} {
  const a = squareCenter(uci.slice(0, 2));
  const b = squareCenter(uci.slice(2, 4));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = 0.42;
  const headHalf = 0.26;
  const tipX = b.x - ux * 0.12;
  const tipY = b.y - uy * 0.12;
  const baseX = tipX - ux * headLen;
  const baseY = tipY - uy * headLen;
  const f = (n: number) => Number(n.toFixed(3));
  return {
    shaft: { x1: f(a.x + ux * 0.18), y1: f(a.y + uy * 0.18), x2: f(baseX + ux * 0.04), y2: f(baseY + uy * 0.04) },
    head: `${f(tipX)},${f(tipY)} ${f(baseX - uy * headHalf)},${f(baseY + ux * headHalf)} ${f(baseX + uy * headHalf)},${f(baseY - ux * headHalf)}`,
    from: a,
    to: b,
  };
}
