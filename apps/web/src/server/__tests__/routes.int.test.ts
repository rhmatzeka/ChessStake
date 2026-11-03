import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "pp_session" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));

import { prisma } from "@/server/prisma";
import { signSession, SESSION_COOKIE } from "@/server/session";
import { INITIAL_FEN } from "@/game/types";
import { resetDatabase, truncateAll } from "@/test/db";
import { GET as lobby } from "@/app/api/events/route";
import { GET as stateGet } from "@/app/api/events/[slug]/state/route";
import { GET as meGet } from "@/app/api/events/[slug]/me/route";
import { POST as picksPost } from "@/app/api/events/[slug]/picks/route";
import { GET as cronGet } from "@/app/api/cron/route";

const PAST = () => new Date(Date.now() - 60_000);
const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });
const base = "http://localhost:3000";

async function mkUser(n: number) {
  const u = await prisma.user.create({ data: { address: `0x${String(n).padStart(40, "0")}` } });
  return u;
}
function login(u: { id: string; address: string }) {
  jar.value = signSession({ uid: u.id, addr: u.address, exp: Date.now() + 60_000 });
}
async function mkEvent(over: Record<string, unknown> = {}) {
  return prisma.event.create({
    data: { slug: "e1", title: "T", hostName: "H", bossLevel: 1, maxCrowdMoves: 30, startsAt: PAST(), fen: INITIAL_FEN, ...over } as never,
  });
}
const post = (slug: string, body: unknown, origin: string | null = base) =>
  picksPost(
    new Request(`${base}/api/events/${slug}/picks`, {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000", ...(origin ? { origin } : {}) },
      body: JSON.stringify(body),
    }),
    ctx(slug),
  );

beforeAll(resetDatabase);
beforeEach(async () => {
  await truncateAll();
  jar.value = undefined;
  vi.stubEnv("CRON_SECRET", "s3cret");
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());
void SESSION_COOKIE;

describe("lobby", () => {
  it("groups events, caches, shows only latest practice", async () => {
    await mkEvent({ slug: "live1", status: "LIVE", startedAt: new Date() });
    await mkEvent({ slug: "up2", status: "SCHEDULED", startsAt: new Date(Date.now() + 2e6) });
    await mkEvent({ slug: "up1", status: "SCHEDULED", startsAt: new Date(Date.now() + 1e6) });
    await mkEvent({ slug: "practice-1", isPractice: true, status: "LIVE", createdAt: new Date(Date.now() - 5000) });
    await mkEvent({ slug: "practice-2", isPractice: true, status: "LIVE" });
    const fin = await mkEvent({ slug: "done", status: "FINISHED", result: "WIN", finishedAt: new Date() });
    const u = await mkUser(1);
    await prisma.user.update({ where: { id: u.id }, data: { displayName: "Alice" } });
    await prisma.eventScore.create({ data: { eventId: fin.id, userId: u.id, turnsPicked: 2, points: 50, bonus: 10 } });
    await mkEvent({ slug: "pfin", isPractice: true, status: "FINISHED", result: "WIN" });

    const res = await lobby();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=5, stale-while-revalidate=10");
    const { data } = await res.json();
    expect(data.live.map((e: { slug: string }) => e.slug).sort()).toEqual(["live1", "practice"]);
    expect(data.upcoming.map((e: { slug: string }) => e.slug)).toEqual(["up1", "up2"]);
    expect(data.past.map((e: { slug: string }) => e.slug)).toEqual(["done"]);
    expect(data.past[0].top3).toEqual([{ name: "Alice", points: 60 }]);
    expect(data.past[0].playersCount).toBe(1);
    expect(data.live.find((e: { slug: string }) => e.slug === "practice").isPractice).toBe(true);
  });
});

describe("state", () => {
  it("200 with cache header, no per-user fields", async () => {
    await mkEvent({ status: "SCHEDULED" });
    const res = await stateGet(new Request(`${base}/api/events/e1/state`), ctx("e1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=1, stale-while-revalidate=1");
    const { data } = await res.json();
    expect(data.status).toBe("LIVE");
    expect(data).not.toHaveProperty("pickUci");
  });
  it("unknown slug 404 no-store", async () => {
    const res = await stateGet(new Request(`${base}/api/events/nope/state`), ctx("nope"));
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await res.json()).error.code).toBe("EVENT_NOT_FOUND");
  });
});

describe("me", () => {
  it("401 without session, private no-store with", async () => {
    await mkEvent({ status: "LIVE", startedAt: new Date() });
    const r1 = await meGet(new Request(`${base}/api/events/e1/me`), ctx("e1"));
    expect(r1.status).toBe(401);
    login(await mkUser(1));
    const r2 = await meGet(new Request(`${base}/api/events/e1/me`), ctx("e1"));
    expect(r2.status).toBe(200);
    expect(r2.headers.get("cache-control")).toBe("private, no-store");
    expect((await r2.json()).data.pickUci).toBeNull();
  });
});

describe("picks", () => {
  it("401 without session", async () => {
    const r = await post("e1", { turnNumber: 1, uci: "e2e4" });
    expect(r.status).toBe(401);
  });
  it("403 on bad origin", async () => {
    login(await mkUser(1));
    expect((await post("e1", { turnNumber: 1, uci: "e2e4" }, "http://evil.com")).status).toBe(403);
  });
  it("400 on bad body", async () => {
    login(await mkUser(1));
    for (const b of [{ turnNumber: 0, uci: "e2e4" }, { turnNumber: 1, uci: "z9z9" }, { turnNumber: 1.5, uci: "e2e4" }, {}]) {
      const r = await post("e1", b);
      expect(r.status).toBe(400);
      expect((await r.json()).error.code).toBe("VALIDATION_ERROR");
    }
  });
  it("submits a pick and shows it in me", async () => {
    await mkEvent({ status: "SCHEDULED" });
    const u = await mkUser(1);
    login(u);
    const s = await (await stateGet(new Request(`${base}/x`), ctx("e1"))).json();
    const uci = s.data.turn.candidates[0].uci;
    await new Promise((r) => setTimeout(r, 2100));
    const r = await post("e1", { turnNumber: 1, uci });
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual({ turnNumber: 1, uci });
    const me = await (await meGet(new Request(`${base}/x`), ctx("e1"))).json();
    expect(me.data.pickUci).toBe(uci);
  });
  it("rate-limits at 10 per 10s per user", async () => {
    await mkEvent({ status: "LIVE", startedAt: new Date() });
    login(await mkUser(1));
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) codes.push((await post("e1", { turnNumber: 1, uci: "e2e4" })).status);
    expect(codes.slice(0, 10).every((c) => c !== 429)).toBe(true);
    expect(codes[10]).toBe(429);
  });
});

describe("cron", () => {
  const call = (auth?: string) =>
    cronGet(new Request(`${base}/api/cron`, { headers: auth ? { authorization: auth } : {} }));
  it("401 without or with wrong bearer, and when secret unset", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(401);
    expect((await call("Bearer undefined")).status).toBe(401);
  });
  it("progresses due scheduled events and the practice alias", async () => {
    await mkEvent({ slug: "due", status: "SCHEDULED" });
    await mkEvent({ slug: "later", status: "SCHEDULED", startsAt: new Date(Date.now() + 1e7) });
    const r = await call("Bearer s3cret");
    expect(r.status).toBe(200);
    const { data } = await r.json();
    expect(data.progressed).toBeGreaterThanOrEqual(1);
    expect((await prisma.event.findUnique({ where: { slug: "due" } }))!.status).toBe("LIVE");
    expect((await prisma.event.findUnique({ where: { slug: "later" } }))!.status).toBe("SCHEDULED");
  });
});
