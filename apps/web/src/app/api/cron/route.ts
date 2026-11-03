import { timingSafeEqual } from "node:crypto";
import { AppError } from "@/server/errors";
import { fail, ok } from "@/server/http";
import { progressAllEvents } from "@/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(req: Request) {
  try {
    if (!authorised(req)) throw new AppError("UNAUTHORIZED", 401, "Unauthorized");
    return ok({ progressed: await progressAllEvents() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e);
  }
}
