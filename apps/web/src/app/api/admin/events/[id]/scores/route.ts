import { ok, fail, assertSameOrigin } from "@/server/http";
import { assertEventExists, requireAdmin, updateScore } from "@/server/admin";
import { eventLeaderboard, leaderboardCsv } from "@/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NS = { headers: { "Cache-Control": "private, no-store" } };
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await assertEventExists(id);
    const rows = await eventLeaderboard(id);
    if (new URL(req.url).searchParams.get("format") === "csv") {
      return new Response(leaderboardCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leaderboard-${id}.csv"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    return ok(rows, NS);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await params;
    await updateScore(id, await req.json().catch(() => ({})));
    return ok({ updated: true }, NS);
  } catch (e) {
    return fail(e);
  }
}
