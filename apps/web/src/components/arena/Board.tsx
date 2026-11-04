import { arrowGeometry, cornerTicks, parseFen, squareCoords } from "./geometry";
import "./chess-board.css";
import "./chess-pieces.css";

export type BoardArrow = { uci: string; letter: string; state: "normal" | "picked" | "dim" };

const IVORY = "#f3ecdf";
const GOLD = "#e6a855";
const INK = "#100d0a";

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
      <div className="chess-board-art pixel absolute inset-0 -scale-x-100 bg-contain bg-center bg-no-repeat" />
      <div className="absolute" style={{ inset: `${INSET}%` }}>
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
            <div
              key={slide ? `${p.sq}-${p.kind}-${fen}` : `${p.sq}-${p.kind}${p.color}`}
              className={`chess-piece chess-${p.color}${p.kind} pixel pointer-events-none absolute h-[12.5%] w-[12.5%] ${slide ? "piece-glide z-10" : ""}`}
              style={{ ...cell(p.sq), ...slide }}
            />
          );
        })}

        <svg viewBox="0 0 8 8" className="absolute inset-0 z-20 h-full w-full" aria-hidden="true">
          {[from, to].map((sq) => {
            if (!sq) return null;
            const d = cornerTicks(sq);
            return (
              <g key={sq} data-last-move="">
                <path d={d} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={0.075} strokeLinecap="square" />
                <path d={d} fill="none" stroke={IVORY} strokeWidth={0.032} strokeLinecap="square" />
              </g>
            );
          })}
          {arrows.map((a) => {
            const g = arrowGeometry(a.uci);
            const tone = a.state === "picked" ? GOLD : IVORY;
            return (
              <g
                key={a.uci}
                opacity={a.state === "dim" ? 0.38 : 1}
                style={{ cursor: onArrow ? "pointer" : "default" }}
                onClick={onArrow ? () => onArrow(a.uci) : undefined}
              >
                <polygon points={g.blade} fill={INK} fillOpacity={0.6} stroke={INK} strokeOpacity={0.6} strokeWidth={0.07} strokeLinejoin="round" />
                <polygon points={g.blade} fill={tone} />
                <circle cx={g.badge.x} cy={g.badge.y} r={0.15} fill={INK} stroke={tone} strokeWidth={0.022} />
                <text
                  x={g.badge.x}
                  y={g.badge.y}
                  fill={tone}
                  fontSize={0.18}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-mono"
                >
                  {a.letter}
                </text>
                {onArrow && <line {...g.hit} stroke="transparent" strokeWidth={0.55} strokeLinecap="round" pointerEvents="stroke" />}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
