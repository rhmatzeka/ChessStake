import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    const sessionId = body?.sessionId;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ ok: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'sessionId is required' } }, { status: 400 });
    }

    const count = await VercelGameService.heartbeatSpectator(gameId, sessionId);
    return NextResponse.json({ ok: true, data: { count }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const count = await VercelGameService.getSpectatorCount(gameId);
    return NextResponse.json({ ok: true, data: { count }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
