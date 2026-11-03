import Image from "next/image";

const FILES = {
  pawn: "Pawn",
  knight: "Knight",
  bishop: "Bishop",
  rook: "Rook",
  queen: "Queen",
  king: "King",
} as const;

export type SpriteKind = keyof typeof FILES;

/** Pixel chess piece from /public/assets/chess, never smoothed. */
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
    <Image
      src={`/assets/chess/${side}${FILES[piece]}.png`}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`pixel ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
