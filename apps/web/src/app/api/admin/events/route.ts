import { ok, fail, assertSameOrigin } from "@/server/http";
import { createEvent, listAdminEvents, requireAdmin } from "@/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NS = { headers: { "Cache-Control": "private, no-store" } };

export async function GET() {
  try {
    await requireAdmin();
    return ok(await listAdminEvents(), NS);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    return ok(await createEvent(await req.json().catch(() => ({}))), NS);
  } catch (e) {
    return fail(e);
  }
}
