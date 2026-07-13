import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'creator';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title || '').trim();
    const creatorName = String(body.creatorName || '').trim();
    const description = String(body.description || '').trim();
    const creatorAddress = body.creatorAddress ? String(body.creatorAddress).trim() : '';
    const creatorFeeBps = Number(body.creatorFeeBps ?? 300);

    if (title.length < 3) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_TITLE', message: 'Match title must be at least 3 characters.' } }, { status: 400 });
    }

    if (creatorName.length < 2) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_CREATOR', message: 'Creator name must be at least 2 characters.' } }, { status: 400 });
    }

    if (!Number.isFinite(creatorFeeBps) || creatorFeeBps < 0 || creatorFeeBps > 1000) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_FEE', message: 'Creator fee must be between 0% and 10%.' } }, { status: 400 });
    }

    const game = await VercelGameService.createGame({
      title,
      description: description || undefined,
      creatorName,
      creatorAddress: creatorAddress || undefined,
      creatorSlug: slugify(creatorName),
      creatorFeeBps,
    });

    await VercelGameService.trackEvent({
      name: 'creator_match_created',
      gameId: game.id,
      address: creatorAddress || null,
      payload: { title, creatorName, creatorFeeBps },
    });

    return NextResponse.json({ ok: true, data: { gameId: game.id, arenaUrl: `/arena/${game.id}` }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
