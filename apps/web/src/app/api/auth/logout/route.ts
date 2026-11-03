import { assertSameOrigin, fail, ok } from "@/server/http";
import { clearSession } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await clearSession();
    return ok({});
  } catch (e) {
    return fail(e);
  }
}
