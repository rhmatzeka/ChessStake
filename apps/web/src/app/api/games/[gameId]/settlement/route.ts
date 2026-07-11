import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      const bettors = await VercelGameService.getGameBettors(gameId);
      return NextResponse.json({ ok: true, data: { gameId, bettors }, error: null });
    }

    const settlement = await VercelGameService.getSettlement(gameId, address);
    return NextResponse.json({ ok: true, data: settlement, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'GAME_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ ok: false, data: null, error: { code: message, message } }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    const address = body?.address;

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ ok: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'address is required' } }, { status: 400 });
    }

    const settlement = await VercelGameService.claimSettlement(gameId, address);
    return NextResponse.json({ ok: true, data: settlement, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'GAME_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ ok: false, data: null, error: { code: message, message } }, { status });
  }
}
