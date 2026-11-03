import { z } from "zod";
import { assertSameOrigin, fail, ok, rateLimit } from "@/server/http";
import { submitPick } from "@/server/events";
import { requireUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  turnNumber: z.number().int().min(1),
  uci: z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/, "invalid move"),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    assertSameOrigin(req);
    const { userId } = await requireUser();
    rateLimit(`pick:${userId}`, 10, 10_000);
    const { turnNumber, uci } = Body.parse(await req.json().catch(() => ({})));
    const { slug } = await params;
    await submitPick(slug, userId, turnNumber, uci);
    return ok({ turnNumber, uci }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e);
  }
}
