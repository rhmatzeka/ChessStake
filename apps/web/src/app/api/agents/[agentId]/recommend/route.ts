import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    const gameId = String(body.gameId || '').trim();
    if (!gameId) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'GAME_REQUIRED', message: 'Game ID is required.' } }, { status: 400 });
    }

    const decision = await VercelGameService.recommendWithAgent(agentId, gameId);
    await VercelGameService.trackEvent({ name: 'agent_recommendation_requested', gameId, payload: { agentId, recommendedPiece: decision.recommendedPiece } });
    return NextResponse.json({ ok: true, data: decision, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: message, message } }, { status: 500 });
  }
}
