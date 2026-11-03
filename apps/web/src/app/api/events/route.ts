import { ok, fail } from "@/server/http";
import { listEvents } from "@/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listEvents(), { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } });
  } catch (e) {
    return fail(e);
  }
}
