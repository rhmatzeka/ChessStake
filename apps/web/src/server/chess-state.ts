import { Chess } from 'chess.js';

export class ChessStateService {
  public static getLegalMovesForPiece(fen: string, pieceType: string, team: string): string[] {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    const teamCode = team === 'WHITE' ? 'w' : 'b';
    const pieceCode = pieceType === 'KNIGHT' ? 'n' : pieceType[0].toLowerCase();

    return moves
      .filter((move) => move.color === teamCode && move.piece === pieceCode)
      .map((move) => `${move.from}${move.to}`);
  }

  public static validateMove(fen: string, from: string, to: string) {
    const chess = new Chess(fen);

    try {
      const move = chess.move({ from, to, promotion: 'q' });
      return {
        isValid: true,
        san: move.san,
        fenAfter: chess.fen(),
      };
    } catch {
      return { isValid: false };
    }
  }

  public static checkGameResult(fen: string): {
    isGameOver: boolean;
    result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null;
  } {
    const chess = new Chess(fen);

    if (!chess.isGameOver()) {
      return { isGameOver: false };
    }

    if (chess.isCheckmate()) {
      return { isGameOver: true, result: chess.turn() === 'w' ? 'BLACK_WIN' : 'WHITE_WIN' };
    }

    return { isGameOver: true, result: 'DRAW' };
  }
}
