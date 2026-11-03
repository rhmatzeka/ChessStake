import { fail, ok } from "@/server/http";
import { getPublicState } from "@/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

// Must not read cookies or the session: the response is shared through the CDN.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    return ok(await getPublicState(slug), { headers: { "Cache-Control": "public, s-maxage=1, stale-while-revalidate=1" } });
  } catch (e) {
    const res = fail(e);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
