import { z } from "zod";
import { prisma } from "@/server/prisma";
import { assertSameOrigin, fail, ok } from "@/server/http";
import { getSession, requireUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9_ .-]+$/, "only letters, numbers, space, _ . -"),
});

export async function GET() {
  try {
    const s = await getSession();
    if (!s) return ok(null);
    const user = await prisma.user.findUnique({ where: { id: s.userId } });
    return ok(user ? { address: user.address, displayName: user.displayName } : null);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const s = await requireUser();
    const { displayName } = Body.parse(await req.json().catch(() => ({})));
    const user = await prisma.user.update({ where: { id: s.userId }, data: { displayName } });
    return ok({ address: user.address, displayName: user.displayName });
  } catch (e) {
    return fail(e);
  }
}
