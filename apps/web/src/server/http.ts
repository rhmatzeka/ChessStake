import { ZodError } from "zod";
import { AppError } from "@/server/errors";

function json(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function ok<T>(data: T, init?: ResponseInit): Response {
  return json({ ok: true, data }, init);
}

export function fail(err: unknown): Response {
  if (err instanceof AppError) {
    return json({ ok: false, error: { code: err.code, message: err.message } }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const i = err.issues[0];
    const msg = i ? `${i.path.join(".") || "input"}: ${i.message}` : "Invalid input";
    return json({ ok: false, error: { code: "VALIDATION_ERROR", message: msg } }, { status: 400 });
  }
  console.error(err);
  return json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
}

/** Rejects cross-site writes: the Origin header must match this request's own origin. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) throw new AppError("BAD_ORIGIN", 403, "Missing origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let own: string;
  if (host) {
    const proto = (req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "")).split(",")[0].trim();
    own = `${proto}://${host}`;
  } else {
    own = new URL(req.url).origin;
  }
  if (origin !== own) throw new AppError("BAD_ORIGIN", 403, "Cross-site request blocked");
}

const hits = new Map<string, number[]>();

/** Per-instance sliding window limiter. */
export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    throw new AppError("RATE_LIMITED", 429, "Too many requests, slow down");
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export function requestHost(req: Request): string {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
}
