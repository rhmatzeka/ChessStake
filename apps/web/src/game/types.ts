/** Standard chess start position. */
export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Boss strength, 1 (weakest) to 5 (strongest). */
export type BossLevel = 1 | 2 | 3 | 4 | 5;

/** One analysed move. cp is from the side-to-move's view; mate scores are clamped to +/-1000. */
export type EngineLine = { uci: string; cp: number };
