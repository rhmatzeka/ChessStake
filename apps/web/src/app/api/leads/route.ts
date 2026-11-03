import { ok, fail, assertSameOrigin, rateLimit, clientIp } from "@/server/http";
import { createLead } from "@/server/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`lead:${clientIp(req)}`, 3, 3_600_000);
    await createLead(await req.json().catch(() => ({})));
    return ok({ received: true });
  } catch (e) {
    return fail(e);
  }
}
