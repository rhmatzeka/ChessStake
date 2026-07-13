import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_EVENT', message: 'Event name is required.' } }, { status: 400 });
    }

    await VercelGameService.trackEvent({
      name,
      gameId: body.gameId ? String(body.gameId) : null,
      address: body.address ? String(body.address) : null,
      sessionId: body.sessionId ? String(body.sessionId) : null,
      payload: body.payload || null,
    });

    return NextResponse.json({ ok: true, data: { tracked: true }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
