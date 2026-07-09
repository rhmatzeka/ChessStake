import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const resolution = await VercelGameService.resolveExpiredTurn(gameId);
    return NextResponse.json({ ok: true, data: resolution, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = ['TURN_NOT_EXPIRED', 'GAME_NOT_RESOLVABLE'].includes(message) ? 409 : 500;
    return NextResponse.json({ ok: false, data: null, error: { code: message, message } }, { status });
  }
}
