import { NextResponse } from 'next/server';
import { prisma } from '../../../server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await prisma.game.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
    const data = games.map((game) => ({
      gameId: game.id,
      title: game.title || (game.status === 'ACTIVE' ? 'AI Boss Battle Live' : `ChessStake Match ${game.id.slice(-4)}`),
      description: game.description,
      host: game.creatorName || 'ChessStake',
      creatorFeeBps: game.creatorFeeBps,
      status: game.status,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      winner: game.winner,
      totalPoolWei: (BigInt(game.whitePoolWei) + BigInt(game.blackPoolWei)).toString(),
      createdAt: game.createdAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
