import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "@/server/errors";
import { fail, ok, assertSameOrigin, rateLimit } from "@/server/http";
import { signSession, verifySessionToken } from "@/server/session";

const req = (headers: Record<string, string>, method = "POST") =>
  new Request("http://localhost:3000/api/x", { method, headers });

describe("session token", () => {
  const data = { uid: "u1", addr: "0xabc", exp: Date.now() + 60_000 };
  it("round trips", () => {
    expect(verifySessionToken(signSession(data))).toEqual(data);
  });
  it("rejects tampering, bad format and expiry", () => {
    const t = signSession(data);
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...data, uid: "u2" })).toString("base64url");
    expect(verifySessionToken(`${forged}.${s}`)).toBeNull();
    expect(verifySessionToken(`${p}.${s.slice(0, -2)}AA`)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken(signSession({ ...data, exp: Date.now() - 1 }))).toBeNull();
  });
});

describe("assertSameOrigin", () => {
  it("accepts own origin", () => {
    expect(() => assertSameOrigin(req({ origin: "https://pp.test", host: "pp.test", "x-forwarded-proto": "https" }))).not.toThrow();
    expect(() => assertSameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" }))).not.toThrow();
  });
  it("rejects foreign or missing origin", () => {
    for (const h of <Record<string, string>[]>[
      { origin: "https://evil.test", host: "pp.test", "x-forwarded-proto": "https" },
      { host: "pp.test" },
    ]) {
      try {
        assertSameOrigin(req(h));
        throw new Error("did not throw");
      } catch (e) {
        expect((e as AppError).code).toBe("BAD_ORIGIN");
        expect((e as AppError).status).toBe(403);
      }
    }
  });
});

describe("rateLimit", () => {
  it("blocks after max within window", () => {
    rateLimit("k1", 2, 1000);
    rateLimit("k1", 2, 1000);
    expect(() => rateLimit("k1", 2, 1000)).toThrow(expect.objectContaining({ code: "RATE_LIMITED", status: 429 }));
    rateLimit("k2", 2, 1000);
  });
  it("frees after the window", () => {
    vi.useFakeTimers();
    rateLimit("k3", 1, 1000);
    expect(() => rateLimit("k3", 1, 1000)).toThrow();
    vi.advanceTimersByTime(1001);
    expect(() => rateLimit("k3", 1, 1000)).not.toThrow();
    vi.useRealTimers();
  });
});

describe("ok / fail", () => {
  it("wraps data", async () => {
    const r = ok({ a: 1 });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, data: { a: 1 } });
  });
  it("maps AppError", async () => {
    const r = fail(new AppError("NOPE", 409, "no"));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ ok: false, error: { code: "NOPE", message: "no" } });
  });
  it("hides unknown error text and logs it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = fail(new Error("PrismaClientKnownRequestError: relation \"User\" secret"));
    expect(r.status).toBe(500);
    const body = await r.json();
    expect(body).toEqual({ ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
    expect(JSON.stringify(body)).not.toContain("Prisma");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it("maps ZodError to 400", async () => {
    const res = z.object({ n: z.number() }).safeParse({ n: "x" });
    const r = fail((res as { error: unknown }).error);
    expect(r.status).toBe(400);
    expect((await r.json()).error.code).toBe("VALIDATION_ERROR");
  });
});
