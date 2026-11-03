import { fail, ok } from "@/server/http";
import { getMyState } from "@/server/events";
import { requireUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { userId } = await requireUser();
    const { slug } = await params;
    return ok(await getMyState(slug, userId), { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    const res = fail(e);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
}
