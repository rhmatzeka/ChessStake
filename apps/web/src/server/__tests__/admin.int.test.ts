import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "pp_session" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));

import { prisma } from "@/server/prisma";
import { signSession } from "@/server/session";
import { INITIAL_FEN } from "@/game/types";
import { resetDatabase, truncateAll } from "@/test/db";
import { GET as evList, POST as evCreate } from "@/app/api/admin/events/route";
import { PATCH as evPatch } from "@/app/api/admin/events/[id]/route";
import { GET as scGet, PATCH as scPatch } from "@/app/api/admin/events/[id]/scores/route";
import { GET as ldGet, PATCH as ldPatch } from "@/app/api/admin/leads/route";
import { POST as leadPost } from "@/app/api/leads/route";

const base = "http://localhost:3000";
const ADMIN = `0x${"b".repeat(40)}`;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const hdr = { "content-type": "application/json", host: "localhost:3000", origin: base };
const req = (path: string, method: string, body?: unknown, headers: Record<string, string> = hdr) =>
  new Request(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });

async function mkUser(address: string, displayName?: string) {
  return prisma.user.create({ data: { address, displayName } });
}
function login(u: { id: string; address: string }) {
  jar.value = signSession({ uid: u.id, addr: u.address, exp: Date.now() + 60_000 });
}
async function loginAdmin() {
  const u = await mkUser(ADMIN);
  login(u);
  return u;
}
const future = () => new Date(Date.now() + 86_400_000).toISOString();
const valid = (over: Record<string, unknown> = {}) => ({
  title: "Spring Open", slug: "spring-open", hostName: "Host", startsAt: future(), bossLevel: 3, ...over,
});
async function mkEvent(over: Record<string, unknown> = {}) {
  return prisma.event.create({
    data: { slug: "e1", title: "T", hostName: "H", bossLevel: 1, maxCrowdMoves: 30, startsAt: new Date(Date.now() + 1e6), fen: INITIAL_FEN, ...over } as never,
  });
}

beforeAll(resetDatabase);
beforeEach(async () => {
  await truncateAll();
  jar.value = undefined;
  vi.stubEnv("ADMIN_ADDRESSES", ` ${ADMIN.toUpperCase().replace("0X", "0x")} , 0xdead `);
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => prisma.$disconnect());

describe("auth", () => {
  it("401 anonymous, 403 NOT_ADMIN for normal user, 403 when env empty", async () => {
    expect((await evList()).status).toBe(401);
    const u = await mkUser(`0x${"c".repeat(40)}`);
    login(u);
    const r = await evList();
    expect(r.status).toBe(403);
    expect((await r.json()).error.code).toBe("NOT_ADMIN");
    const a = await mkUser(ADMIN);
    login(a);
    expect((await evList()).status).toBe(200);
    vi.stubEnv("ADMIN_ADDRESSES", "");
    expect((await evList()).status).toBe(403);
  });
});

describe("events", () => {
  it("creates, lists (no practice, newest first, playersCount), no-store", async () => {
    await loginAdmin();
    const res = await evCreate(req("/api/admin/events", "POST", valid()));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const { data } = await res.json();
    expect(data.status).toBe("SCHEDULED");
    expect(data.maxCrowdMoves).toBe(30);
    expect(data.fen).toBe(INITIAL_FEN);
    await mkEvent({ slug: "practice-1", isPractice: true });
    await mkEvent({ slug: "older", startsAt: new Date(Date.now() - 1e8), createdAt: new Date(Date.now() - 1e8) });
    const list = await (await evList()).json();
    expect(list.data.map((e: { slug: string }) => e.slug)).toEqual(["spring-open", "older"]);
    expect(list.data[0].playersCount).toBe(0);
  });

  it("validates: reserved slug, duplicate, past date, bad origin", async () => {
    await loginAdmin();
    for (const slug of ["practice", "practice-2"]) {
      const r = await evCreate(req("/api/admin/events", "POST", valid({ slug })));
      expect(r.status).toBe(400);
      expect((await r.json()).error.code).toBe("SLUG_RESERVED");
    }
    expect((await evCreate(req("/api/admin/events", "POST", valid()))).status).toBe(200);
    const dup = await evCreate(req("/api/admin/events", "POST", valid()));
    expect(dup.status).toBe(409);
    expect((await dup.json()).error.code).toBe("SLUG_TAKEN");
    expect((await evCreate(req("/api/admin/events", "POST", valid({ slug: "old", startsAt: new Date(Date.now() - 3_600_000).toISOString() })))).status).toBe(400);
    expect((await evCreate(req("/api/admin/events", "POST", valid({ slug: "skew", startsAt: new Date(Date.now() - 60_000).toISOString() })))).status).toBe(200);
    expect((await evCreate(req("/api/admin/events", "POST", valid({ slug: "x1", sponsorUrl: "http://insecure.com" })))).status).toBe(400);
    expect((await evCreate(req("/api/admin/events", "POST", valid({ slug: "x2" }), { ...hdr, origin: "https://evil.com" }))).status).toBe(403);
  });

  it("PATCH edits only while SCHEDULED; cancel works for SCHEDULED and LIVE", async () => {
    await loginAdmin();
    const e = await mkEvent();
    const r = await evPatch(req(`/api/admin/events/${e.id}`, "PATCH", { title: "New title", bossLevel: 5 }), ctx(e.id));
    expect(r.status).toBe(200);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: e.id } })).title).toBe("New title");
    const live = await mkEvent({ slug: "live", status: "LIVE" });
    const locked = await evPatch(req(`/api/admin/events/${live.id}`, "PATCH", { title: "Nope" }), ctx(live.id));
    expect(locked.status).toBe(409);
    expect((await locked.json()).error.code).toBe("EVENT_LOCKED");
    expect((await evPatch(req(`/api/admin/events/${live.id}`, "PATCH", { action: "cancel" }), ctx(live.id))).status).toBe(200);
    const after = await prisma.event.findUniqueOrThrow({ where: { id: live.id } });
    expect([after.status, after.result, after.finishedAt !== null]).toEqual(["ABANDONED", null, true]);
    const fin = await mkEvent({ slug: "fin", status: "FINISHED", result: "WIN" });
    expect((await evPatch(req(`/api/admin/events/${fin.id}`, "PATCH", { action: "cancel" }), ctx(fin.id))).status).toBe(409);
    expect((await evPatch(req(`/api/admin/events/nope`, "PATCH", { action: "cancel" }), ctx("nope"))).status).toBe(404);
  });
});

describe("scores", () => {
  it("csv export, disqualify, markPaid only when eligible", async () => {
    await loginAdmin();
    const ev = await mkEvent({ status: "FINISHED", result: "WIN" });
    const u1 = await mkUser(`0x${"1".repeat(40)}`, "One");
    const u2 = await mkUser(`0x${"2".repeat(40)}`, "Two");
    await prisma.eventScore.create({ data: { eventId: ev.id, userId: u1.id, turnsPicked: 12, points: 300 } });
    await prisma.eventScore.create({ data: { eventId: ev.id, userId: u2.id, turnsPicked: 4, points: 100 } });

    const csvRes = await scGet(req(`/api/admin/events/${ev.id}/scores?format=csv`, "GET"), ctx(ev.id));
    expect(csvRes.headers.get("content-type")).toContain("text/csv");
    expect(csvRes.headers.get("content-disposition")).toContain("attachment");
    expect(csvRes.headers.get("cache-control")).toBe("private, no-store");
    const lines = (await csvRes.text()).split("\r\n");
    expect(lines[0]).toBe("rank,name,address,points,turnsPicked,eligible");
    expect(lines[1]).toBe(`1,One,${u1.address},300,12,true`);
    expect(lines[2]).toBe(`2,Two,${u2.address},100,4,false`);

    const json = await (await scGet(req(`/api/admin/events/${ev.id}/scores`, "GET"), ctx(ev.id))).json();
    expect(json.data).toHaveLength(2);

    const patch = (userId: string, action: string) =>
      scPatch(req(`/api/admin/events/${ev.id}/scores`, "PATCH", { userId, action }), ctx(ev.id));
    const np = await patch(u2.id, "markPaid");
    expect(np.status).toBe(409);
    expect((await np.json()).error.code).toBe("NOT_ELIGIBLE");
    expect((await patch(u1.id, "markPaid")).status).toBe(200);
    expect((await prisma.eventScore.findUniqueOrThrow({ where: { eventId_userId: { eventId: ev.id, userId: u1.id } } })).prizePaidAt).not.toBeNull();
    expect((await patch(u1.id, "unmarkPaid")).status).toBe(200);
    expect((await patch(u1.id, "disqualify")).status).toBe(200);
    let row = await prisma.eventScore.findUniqueOrThrow({ where: { eventId_userId: { eventId: ev.id, userId: u1.id } } });
    expect([row.disqualified, row.prizePaidAt]).toEqual([true, null]);
    expect((await patch(u1.id, "markPaid")).status).toBe(409);
    expect((await patch(u1.id, "reinstate")).status).toBe(200);
    row = await prisma.eventScore.findUniqueOrThrow({ where: { eventId_userId: { eventId: ev.id, userId: u1.id } } });
    expect(row.disqualified).toBe(false);
    expect((await patch("ghost", "disqualify")).status).toBe(404);
  });

  it("non-admin cannot export", async () => {
    login(await mkUser(`0x${"c".repeat(40)}`));
    const ev = await mkEvent();
    expect((await scGet(req(`/api/admin/events/${ev.id}/scores?format=csv`, "GET"), ctx(ev.id))).status).toBe(403);
  });
});

describe("leads", () => {
  const lead = (over: Record<string, unknown> = {}, ip = "1.1.1.1") =>
    leadPost(req("/api/leads", "POST", { type: "SPONSOR", name: "Acme", contact: "a@acme.io", message: "hi", ...over }, { ...hdr, "x-forwarded-for": ip }));

  it("stores a lead; honeypot is accepted but not stored; validation; rate limit 3/h/ip", async () => {
    expect((await lead({ organization: "Acme Inc" }, "9.9.9.1")).status).toBe(200);
    expect(await prisma.lead.count()).toBe(1);
    const hp = await lead({ website: "http://spam" }, "9.9.9.2");
    expect(hp.status).toBe(200);
    expect(await prisma.lead.count()).toBe(1);
    expect((await lead({ name: "x".repeat(81) }, "9.9.9.3")).status).toBe(400);
    expect((await lead({ type: "OTHER" }, "9.9.9.3")).status).toBe(400);
    for (let i = 0; i < 3; i++) expect((await lead({}, "7.7.7.7")).status).toBe(200);
    expect((await lead({}, "7.7.7.7")).status).toBe(429);
  });

  it("admin lists newest first, filters handled=false, marks handled", async () => {
    await loginAdmin();
    const a = await prisma.lead.create({ data: { type: "SPONSOR", name: "Old", contact: "c", message: "m", createdAt: new Date(Date.now() - 1e6) } });
    const b = await prisma.lead.create({ data: { type: "CREATOR", name: "New", contact: "c", message: "m" } });
    const all = await (await ldGet(req("/api/admin/leads", "GET"))).json();
    expect(all.data.map((l: { name: string }) => l.name)).toEqual(["New", "Old"]);
    expect((await ldPatch(req("/api/admin/leads", "PATCH", { id: a.id, handled: true }))).status).toBe(200);
    const open = await (await ldGet(req("/api/admin/leads?handled=false", "GET"))).json();
    expect(open.data.map((l: { id: string }) => l.id)).toEqual([b.id]);
    expect((await ldPatch(req("/api/admin/leads", "PATCH", { id: a.id, handled: false }))).status).toBe(200);
    expect((await prisma.lead.findUniqueOrThrow({ where: { id: a.id } })).handledAt).toBeNull();
    expect((await ldPatch(req("/api/admin/leads", "PATCH", { id: "nope", handled: true }))).status).toBe(404);
  });
});
