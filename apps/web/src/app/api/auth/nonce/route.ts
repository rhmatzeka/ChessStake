import { createNonce } from "@/server/auth";
import { clientIp, fail, ok, rateLimit } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    rateLimit(`nonce:${clientIp(req)}`, 30, 60_000);
    return ok({ nonce: await createNonce() });
  } catch (e) {
    return fail(e);
  }
}
