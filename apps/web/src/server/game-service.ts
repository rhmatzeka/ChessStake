import { Chess } from 'chess.js';
import { INITIAL_FEN, MAX_HALF_MOVES, MAX_NO_VOTE_REOPEN, PIECE_PRIORITY, VOTING_DURATION_SECONDS } from 'shared';
import { prisma } from './prisma';
import { ChessStateService } from './chess-state';

const TURN_DURATION_MS = VOTING_DURATION_SECONDS * 1000;

function addWei(a: string, b: string) {
  return (BigInt(a) + BigInt(b)).toString();
}

function jsonSafe<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)));
}

async function getBestMove(fen: string, legalMoves: string[]) {
  if (legalMoves.length === 0) {
    throw new Error('NO_LEGAL_MOVES');
  }

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    const chess = new Chess(fen);
    const to = move.slice(2, 4);
    const targetPiece = chess.get(to as any);
    const values: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    const score = targetPiece ? values[targetPiece.type] || 0 : 0;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

async function resolveBestMoveForPiece(fen: string, team: 'WHITE' | 'BLACK', winningPiece: string, fallbackPieces: string[]) {
  let targetPiece = winningPiece;
  let legalMoves = ChessStateService.getLegalMovesForPiece(fen, targetPiece, team);

  if (legalMoves.length === 0) {
    for (const fallback of fallbackPieces) {
      legalMoves = ChessStateService.getLegalMovesForPiece(fen, fallback, team);
      if (legalMoves.length > 0) {
        targetPiece = fallback;
        break;
      }
    }
  }

  if (legalMoves.length === 0) {
    for (const piece of ['QUEEN', 'ROOK', 'BISHOP', 'KNIGHT', 'KING', 'PAWN']) {
      legalMoves = ChessStateService.getLegalMovesForPiece(fen, piece, team);
      if (legalMoves.length > 0) {
        targetPiece = piece;
        break;
      }
    }
  }

  if (legalMoves.length === 0) {
    throw new Error('NO_LEGAL_MOVES_AVAILABLE');
  }

  const bestMoveUci = await getBestMove(fen, legalMoves);
  const from = bestMoveUci.slice(0, 2);
  const to = bestMoveUci.slice(2, 4);
  const validation = ChessStateService.validateMove(fen, from, to);

  if (!validation.isValid || !validation.fenAfter || !validation.san) {
    throw new Error('RESOLVED_MOVE_INVALID');
  }

  return {
    from,
    to,
    uci: bestMoveUci,
    san: validation.san,
    fenBefore: fen,
    fenAfter: validation.fenAfter,
    targetPiece,
  };
}

export class VercelGameService {
  public static async createGame() {
    const now = Date.now();
    const gameId = `game_${now}`;
    const chainGameId = String(now);

    const game = await prisma.game.create({
      data: {
        id: gameId,
        chainGameId,
        status: 'ACTIVE',
        currentFen: INITIAL_FEN,
        currentTurn: 'WHITE',
        turnNumber: 1,
        turnStatus: 'OPEN',
      },
    });

    await prisma.turn.create({
      data: {
        gameId,
        turnNumber: 1,
        team: 'WHITE',
        status: 'OPEN',
        openedAt: new Date(),
        endsAt: new Date(Date.now() + TURN_DURATION_MS),
      },
    });

    return jsonSafe(game);
  }

  public static async getActiveGameOrCreate() {
    const game = await prisma.game.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    return game || this.createGame();
  }

  public static async getGameState(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        turns: {
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!game) return null;

    const bets = await prisma.bet.findMany({
      where: {
        gameId,
        turnNumber: game.turnNumber,
        status: 'CONFIRMED_VALID',
      },
    });

    const votes = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'].map((piece) => {
      const pieceBets = bets.filter((bet: { piece: string }) => bet.piece === piece);
      const firstBetAt = pieceBets.reduce((earliest: string | null, bet: { createdAt: Date }) => {
        const createdAt = bet.createdAt.toISOString();
        return !earliest || createdAt < earliest ? createdAt : earliest;
      }, null);

      return {
        piece,
        totalAmountWei: pieceBets.reduce((sum: bigint, bet: { amountWei: string }) => sum + BigInt(bet.amountWei), BigInt(0)).toString(),
        bettorCount: pieceBets.length,
        firstBetAt,
      };
    });

    return jsonSafe({
      gameId: game.id,
      chainGameId: game.chainGameId,
      status: game.status,
      result: game.result,
      fen: game.currentFen,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      turnStatus: game.turnStatus,
      turnEndsAt: game.turns[0]?.endsAt || null,
      whitePoolWei: game.whitePoolWei,
      blackPoolWei: game.blackPoolWei,
      votes,
    });
  }

  public static async placeBetMock(gameId: string, address: string, team: 'WHITE' | 'BLACK', piece: string, amountWei: string) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game || game.status !== 'ACTIVE') throw new Error('GAME_NOT_ACTIVE');
    if (game.turnStatus !== 'OPEN') throw new Error('TURN_LOCKED');
    if (team !== game.currentTurn) throw new Error('WRONG_TEAM_TURN');

    const existingLock = await prisma.playerGameState.findUnique({
      where: { gameId_address: { gameId, address } },
    });

    if (existingLock && existingLock.lockedTeam !== team) throw new Error('TEAM_ALREADY_LOCKED');

    if (!existingLock) {
      await prisma.playerGameState.create({
        data: { gameId, userId: address, address, lockedTeam: team },
      });
    }

    const doubleBet = await prisma.bet.findFirst({
      where: { gameId, turnNumber: game.turnNumber, address },
    });

    if (doubleBet) throw new Error('ALREADY_BET_THIS_TURN');

    const user = await prisma.user.upsert({
      where: { address },
      create: { address },
      update: {},
    });

    const bet = await prisma.bet.create({
      data: {
        gameId,
        userId: user.id,
        address,
        turnNumber: game.turnNumber,
        team,
        piece,
        amountWei,
        status: 'CONFIRMED_VALID',
        txHash: `vercel_tx_${Date.now()}_${Math.random()}`,
      },
    });

    await prisma.game.update({
      where: { id: gameId },
      data: team === 'WHITE'
        ? { whitePoolWei: addWei(game.whitePoolWei, amountWei) }
        : { blackPoolWei: addWei(game.blackPoolWei, amountWei) },
    });

    return jsonSafe(bet);
  }

  public static async resolveExpiredTurn(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { turns: { orderBy: { turnNumber: 'desc' }, take: 1 } },
    });

    if (!game || game.status !== 'ACTIVE' || game.turnStatus !== 'OPEN') {
      throw new Error('GAME_NOT_RESOLVABLE');
    }

    const currentTurn = game.turns[0];
    if (!currentTurn?.endsAt || new Date() < currentTurn.endsAt) {
      throw new Error('TURN_NOT_EXPIRED');
    }

    await prisma.game.update({ where: { id: gameId }, data: { turnStatus: 'LOCKED' } });

    const state = await this.getGameState(gameId);
    const validVotes = state?.votes.filter((vote) => BigInt(vote.totalAmountWei) > BigInt(0)) || [];
    let winningPiece = '';
    let fallbackPieces: string[] = [];

    if (validVotes.length > 0) {
      const sorted = [...validVotes].sort((a, b) => {
        const amtA = BigInt(a.totalAmountWei);
        const amtB = BigInt(b.totalAmountWei);
        if (amtB !== amtA) return amtB > amtA ? 1 : -1;
        if (b.bettorCount !== a.bettorCount) return b.bettorCount - a.bettorCount;
        if (a.firstBetAt && b.firstBetAt && a.firstBetAt !== b.firstBetAt) return a.firstBetAt < b.firstBetAt ? -1 : 1;
        return PIECE_PRIORITY.indexOf(a.piece as any) - PIECE_PRIORITY.indexOf(b.piece as any);
      });

      winningPiece = sorted[0].piece;
      fallbackPieces = sorted.slice(1).map((vote) => vote.piece);
    }

    if (!winningPiece) {
      if (currentTurn.voteReopenCount < MAX_NO_VOTE_REOPEN) {
        const newEndsAt = new Date(Date.now() + TURN_DURATION_MS);
        await prisma.turn.update({
          where: { id: currentTurn.id },
          data: { voteReopenCount: currentTurn.voteReopenCount + 1, endsAt: newEndsAt, status: 'OPEN' },
        });
        await prisma.game.update({ where: { id: gameId }, data: { turnStatus: 'OPEN', noVoteCount: game.noVoteCount + 1 } });
        return { status: 'REOPENED' };
      }

      await prisma.game.update({ where: { id: gameId }, data: { status: 'CANCELLED', result: 'CANCELLED', turnStatus: 'FAILED' } });
      return { status: 'CANCELLED' };
    }

    try {
      const resolution = await resolveBestMoveForPiece(game.currentFen, game.currentTurn as 'WHITE' | 'BLACK', winningPiece, fallbackPieces);

      await prisma.move.create({
        data: {
          gameId,
          turnNumber: game.turnNumber,
          fromSquare: resolution.from,
          toSquare: resolution.to,
          piece: `${game.currentTurn}_${resolution.targetPiece}`,
          san: resolution.san,
          uci: resolution.uci,
          fenBefore: resolution.fenBefore,
          fenAfter: resolution.fenAfter,
        },
      });

      await prisma.turn.update({
        where: { id: currentTurn.id },
        data: { status: 'RESOLVED', resolvedAt: new Date(), lockedAt: new Date(), winningPiece: resolution.targetPiece },
      });

      const gameCheck = ChessStateService.checkGameResult(resolution.fenAfter);
      const nextTurnTeam = game.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';
      const nextTurnNumber = game.turnNumber + 1;

      if (nextTurnNumber > MAX_HALF_MOVES && !gameCheck.isGameOver) {
        gameCheck.isGameOver = true;
        gameCheck.result = 'DRAW';
      }

      if (gameCheck.isGameOver && gameCheck.result) {
        await prisma.game.update({
          where: { id: gameId },
          data: {
            currentFen: resolution.fenAfter,
            status: 'FINISHED',
            result: gameCheck.result,
            winner: gameCheck.result === 'DRAW' ? 'DRAW' : gameCheck.result === 'WHITE_WIN' ? 'WHITE' : 'BLACK',
            turnStatus: 'RESOLVED',
          },
        });

        return { status: 'FINISHED', result: gameCheck.result };
      }

      const newEndsAt = new Date(Date.now() + TURN_DURATION_MS);
      await prisma.game.update({
        where: { id: gameId },
        data: { currentFen: resolution.fenAfter, currentTurn: nextTurnTeam, turnNumber: nextTurnNumber, turnStatus: 'OPEN' },
      });
      await prisma.turn.create({
        data: { gameId, turnNumber: nextTurnNumber, team: nextTurnTeam, status: 'OPEN', openedAt: new Date(), endsAt: newEndsAt },
      });

      return { status: 'NEXT_TURN', turnNumber: nextTurnNumber };
    } catch (err) {
      await prisma.game.update({ where: { id: gameId }, data: { turnStatus: 'OPEN' } });
      throw err;
    }
  }
}
