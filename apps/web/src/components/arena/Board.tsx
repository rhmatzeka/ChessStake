import { arrowGeometry, parseFen, squareCoords, type PieceKind } from "./geometry";

export type BoardArrow = { uci: string; color: string; state: "normal" | "picked" | "dim" };

const NAMES: Record<PieceKind, string> = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" };

/** The 8x8 grid sits inside the decorative frame of Board.png: 16px of 288px on every side. */
const INSET = (16 / 288) * 100;

export function Board({
  fen,
  lastMove,
  animate,
  arrows = [],
  onArrow,
}: {
  fen: string;
  lastMove: { uci: string } | null;
  animate: boolean;
  arrows?: BoardArrow[];
  onArrow?: (uci: string) => void;
}) {
  const pieces = parseFen(fen);
  const from = lastMove?.uci.slice(0, 2);
  const to = lastMove?.uci.slice(2, 4);
  const cell = (sq: string) => {
    const { file, rank } = squareCoords(sq);
    return { left: `${file * 12.5}%`, top: `${(7 - rank) * 12.5}%` };
  };

  return (
    <div className="relative aspect-square w-full select-none">
      {/* Board.png has its dark corner at a8; chess wants it at a1, so mirror the picture only. */}
      <div
        className="pixel absolute inset-0 -scale-x-100 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/assets/chess/Board.png)" }}
      />
      <div className="absolute" style={{ inset: `${INSET}%` }}>
        {[from, to].map(
          (sq, i) =>
            sq && (
              <div key={`hl-${i}-${sq}`} className="absolute h-[12.5%] w-[12.5%] bg-gold/45" style={cell(sq)} />
            ),
        )}

        {pieces.map((p) => {
          const slide =
            animate && lastMove && p.sq === to
              ? (() => {
                  const a = squareCoords(from!);
                  const b = squareCoords(to!);
                  return { "--dx": `${(a.file - b.file) * 100}%`, "--dy": `${(b.rank - a.rank) * 100}%` } as React.CSSProperties;
                })()
              : undefined;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slide ? `${p.sq}-${p.kind}-${fen}` : `${p.sq}-${p.kind}${p.color}`}
              src={`/assets/chess/${p.color === "w" ? "White" : "Black"}${NAMES[p.kind]}.png`}
              alt=""
              draggable={false}
              className={`pixel pointer-events-none absolute h-[12.5%] w-[12.5%] ${slide ? "piece-glide z-10" : ""}`}
              style={{ ...cell(p.sq), ...slide }}
            />
          );
        })}

        <svg viewBox="0 0 8 8" className="absolute inset-0 z-20 h-full w-full" aria-hidden="true">
          {arrows.map((a) => {
            const g = arrowGeometry(a.uci);
            const picked = a.state === "picked";
            const dim = a.state === "dim";
            const w = picked ? 0.22 : 0.15;
            return (
              <g
                key={a.uci}
                opacity={dim ? 0.4 : picked ? 1 : 0.88}
                style={{ cursor: onArrow ? "pointer" : "default" }}
                onClick={onArrow ? () => onArrow(a.uci) : undefined}
              >
                <line {...g.shaft} stroke="rgba(0,0,0,0.55)" strokeWidth={w + 0.1} strokeLinecap="round" />
                <polygon points={g.head} fill="rgba(0,0,0,0.55)" stroke="rgba(0,0,0,0.55)" strokeWidth={0.1} strokeLinejoin="round" />
                <line {...g.shaft} stroke={a.color} strokeWidth={w} strokeLinecap="round" />
                <polygon points={g.head} fill={a.color} />
                <circle cx={g.from.x} cy={g.from.y} r={picked ? 0.17 : 0.12} fill={a.color} stroke="rgba(0,0,0,0.55)" strokeWidth={0.05} />
                {onArrow && <line {...g.shaft} stroke="transparent" strokeWidth={0.55} strokeLinecap="round" pointerEvents="stroke" />}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
