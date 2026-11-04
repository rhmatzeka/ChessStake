export type PieceKind = "p" | "n" | "b" | "r" | "q" | "k";
export type BoardPiece = { sq: string; kind: PieceKind; color: "w" | "b" };

const FILES = "abcdefgh";

/** Letters tie each candidate move's arrow to its card. */
export const candidateLetter = (i: number) => "ABC"[i % 3]!;

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

/** SVG path of four small corner marks inside a square, used to show the last move without tinting the board. */
export function cornerTicks(sq: string): string {
  const { x, y } = squareCenter(sq);
  const near = 0.42;
  const tick = 0.15;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]
    .map(([sx, sy]) => {
      const cx = Number((x + sx! * near).toFixed(3));
      const cy = Number((y + sy! * near).toFixed(3));
      return `M${cx - sx! * tick} ${cy}L${cx} ${cy}L${cx} ${cy - sy! * tick}`;
    })
    .join("");
}

/** Slim arrow from the origin square to the destination: a tapered blade with a swept-back head, as one polygon. */
export function arrowGeometry(uci: string): {
  blade: string;
  badge: { x: number; y: number };
  hit: { x1: number; y1: number; x2: number; y2: number };
} {
  const a = squareCenter(uci.slice(0, 2));
  const b = squareCenter(uci.slice(2, 4));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const f = (n: number) => Number(n.toFixed(3));
  /** A point `along` the line from the origin center, `side` units off it. */
  const at = (along: number, side: number) => ({ x: a.x + ux * along - uy * side, y: a.y + uy * along + ux * side });
  // A one-square move has little shaft, so it starts closer to the piece to leave room for the letter.
  const start = len < 1.5 ? 0.12 : 0.24;
  const tip = len - 0.1;
  const barbs = tip - 0.36;
  const neck = tip - 0.25;
  const outline = [
    at(start, 0.016),
    at(neck, 0.05),
    at(barbs, 0.17),
    at(tip, 0),
    at(barbs, -0.17),
    at(neck, -0.05),
    at(start, -0.016),
  ];
  const badge = at(start + (neck - start) * 0.35, 0);
  const hitStart = at(start, 0);
  const hitEnd = at(tip, 0);
  return {
    blade: outline.map((p) => `${f(p.x)},${f(p.y)}`).join(" "),
    badge: { x: f(badge.x), y: f(badge.y) },
    hit: { x1: f(hitStart.x), y1: f(hitStart.y), x2: f(hitEnd.x), y2: f(hitEnd.y) },
  };
}
