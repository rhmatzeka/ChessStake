import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('ownerAddress');
    const agents = await VercelGameService.getAgents(ownerAddress);
    return NextResponse.json({ ok: true, data: agents, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerAddress = String(body.ownerAddress || '').trim();
    const name = String(body.name || '').trim();
    const personality = String(body.personality || '').trim();
    const riskLevel = String(body.riskLevel || 'BALANCED').trim().toUpperCase();

    if (!ownerAddress) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'OWNER_REQUIRED', message: 'Owner address is required.' } }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_NAME', message: 'Agent name must be at least 2 characters.' } }, { status: 400 });
    }
    if (!['BALANCED', 'AGGRESSIVE', 'DEFENSIVE'].includes(riskLevel)) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_RISK', message: 'Risk level must be BALANCED, AGGRESSIVE, or DEFENSIVE.' } }, { status: 400 });
    }

    const agent = await VercelGameService.createAgent({
      ownerAddress,
      name,
      description: body.description ? String(body.description) : undefined,
      personality: personality || 'Balanced chess strategist',
      riskLevel,
      preferredTeam: body.preferredTeam ? String(body.preferredTeam) : null,
    });

    await VercelGameService.trackEvent({ name: 'agent_created', address: ownerAddress, payload: { agentId: agent.id, riskLevel } });
    return NextResponse.json({ ok: true, data: agent, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
