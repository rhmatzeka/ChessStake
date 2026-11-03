import { ok, fail, assertSameOrigin } from "@/server/http";
import { listLeads, requireAdmin, setLeadHandled } from "@/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NS = { headers: { "Cache-Control": "private, no-store" } };

export async function GET(req: Request) {
  try {
    await requireAdmin();
    return ok(await listLeads(new URL(req.url).searchParams.get("handled") === "false"), NS);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    await setLeadHandled(await req.json().catch(() => ({})));
    return ok({ updated: true }, NS);
  } catch (e) {
    return fail(e);
  }
}
