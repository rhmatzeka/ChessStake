/** Standard chess start position. */
export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Boss strength, 1 (weakest) to 5 (strongest). */
export type BossLevel = 1 | 2 | 3 | 4 | 5;

/** One analysed move. cp is from the side-to-move's view; mate scores are clamped to +/-1000. */
export type EngineLine = { uci: string; cp: number };

/** How good a move is relative to the engine's best: best < 30 cp loss, okay 30-149, blunder >= 150. */
export type Quality = "best" | "okay" | "blunder";

/** One of the (up to 3) moves the crowd can pick from. */
export type Candidate = {
  uci: string;
  san: string;
  label: string;
  evalCp: number;
  cpLoss: number;
  quality: Quality;
};

/** How a Boss Battle event ended for the crowd. */
export type EventResult = "WIN" | "SURVIVED" | "LOST";

/** Lifecycle state of a Boss Battle event. */
export type EventStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "ABANDONED";

/** Votes per candidate for one turn; firstAt is the timestamp of the earliest pick. */
export type PickTally = { uci: string; count: number; firstAt: number }[];
