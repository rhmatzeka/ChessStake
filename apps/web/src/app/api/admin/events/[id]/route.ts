import { ok, fail, assertSameOrigin } from "@/server/http";
import { patchEvent, requireAdmin } from "@/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await params;
    return ok(await patchEvent(id, await req.json().catch(() => ({}))), { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return fail(e);
  }
}
