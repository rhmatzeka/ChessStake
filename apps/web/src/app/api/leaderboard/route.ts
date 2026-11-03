import { ok, fail } from "@/server/http";
import { currentWibMonth, seasonLeaderboard } from "@/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const month = new URL(req.url).searchParams.get("month") ?? currentWibMonth();
    return ok(await seasonLeaderboard(month), { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch (e) {
    return fail(e);
  }
}
