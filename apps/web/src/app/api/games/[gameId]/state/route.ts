import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const state = await VercelGameService.getGameState(gameId);

    if (!state) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'GAME_NOT_FOUND', message: 'Game not found' } }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: state, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
