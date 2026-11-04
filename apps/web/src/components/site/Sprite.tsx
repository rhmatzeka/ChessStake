import "@/components/arena/chess-pieces.css";

const KINDS = { pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k" } as const;

export type SpriteKind = keyof typeof KINDS;

/** Pixel chess piece, embedded in the stylesheet and never smoothed. */
export function Sprite({
  piece,
  side = "White",
  size = 48,
  className = "",
}: {
  piece: SpriteKind;
  side?: "White" | "Black";
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`chess-piece chess-${side === "White" ? "w" : "b"}${KINDS[piece]} pixel ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
