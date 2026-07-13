import { NextResponse } from 'next/server';
import { prisma } from '../../../server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonSafe<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)));
}

export async function GET() {
  try {
    const bets = await prisma.bet.findMany({
      where: { status: 'CONFIRMED_VALID' },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const games = await prisma.game.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });

    const byAddress = new Map<string, { address: string; totalWei: bigint; betCount: number }>();
    for (const bet of bets) {
      const current = byAddress.get(bet.address) || { address: bet.address, totalWei: BigInt(0), betCount: 0 };
      current.totalWei += BigInt(bet.amountWei);
      current.betCount += 1;
      byAddress.set(bet.address, current);
    }

    const topBackers = [...byAddress.values()]
      .sort((a, b) => (b.totalWei > a.totalWei ? 1 : b.totalWei < a.totalWei ? -1 : b.betCount - a.betCount))
      .slice(0, 10)
      .map((entry) => ({ ...entry, totalWei: entry.totalWei.toString() }));

    const biggestPools = games
      .map((game) => ({
        gameId: game.id,
        status: game.status,
        winner: game.winner,
        totalWei: (BigInt(game.whitePoolWei) + BigInt(game.blackPoolWei)).toString(),
        createdAt: game.createdAt.toISOString(),
      }))
      .sort((a, b) => (BigInt(b.totalWei) > BigInt(a.totalWei) ? 1 : -1))
      .slice(0, 10);

    const recentWinners = games
      .filter((game) => game.status === 'FINISHED' || game.status === 'CANCELLED')
      .slice(0, 10)
      .map((game) => ({
        gameId: game.id,
        result: game.result,
        winner: game.winner,
        totalWei: (BigInt(game.whitePoolWei) + BigInt(game.blackPoolWei)).toString(),
        createdAt: game.createdAt.toISOString(),
      }));

    return NextResponse.json({ ok: true, data: jsonSafe({ topBackers, biggestPools, recentWinners }), error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
