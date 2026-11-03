import { z } from "zod";
import { verifySignIn } from "@/server/auth";
import { assertSameOrigin, clientIp, fail, ok, rateLimit, requestHost } from "@/server/http";
import { setSession } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ message: z.string().min(1).max(2000), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`verify:${clientIp(req)}`, 10, 60_000);
    const body = Body.parse(await req.json().catch(() => ({})));
    const user = await verifySignIn(body.message, body.signature as `0x${string}`, requestHost(req));
    await setSession(user);
    return ok({ address: user.address, displayName: user.displayName });
  } catch (e) {
    return fail(e);
  }
}
