import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "pp_session" && jar.value ? { name: n, value: jar.value } : undefined) }),
}));

import { prisma } from "@/server/prisma";
import { INITIAL_FEN } from "@/game/types";
import { resetDatabase, truncateAll } from "@/test/db";
import { eventLeaderboard, seasonLeaderboard, leaderboardCsv } from "@/server/leaderboard";
import { GET as boardGet } from "@/app/api/leaderboard/route";

let n = 0;
async function mkUser(displayName?: string) {
  n += 1;
  return prisma.user.create({ data: { address: `0x${String(n).padStart(4, "0")}${"a".repeat(36)}`, displayName } });
}
async function mkEvent(slug: string, startsAt: Date, over: Record<string, unknown> = {}) {
  return prisma.event.create({
    data: { slug, title: "T", hostName: "H", bossLevel: 1, maxCrowdMoves: 30, startsAt, fen: INITIAL_FEN, ...over } as never,
  });
}
const score = (eventId: string, userId: string, over: Record<string, unknown> = {}) =>
  prisma.eventScore.create({ data: { eventId, userId, turnsPicked: 10, points: 100, bonus: 0, ...over } as never });

beforeAll(resetDatabase);
beforeEach(truncateAll);
afterAll(() => prisma.$disconnect());

describe("seasonLeaderboard", () => {
  it("sums points+bonus across events, excludes disqualified, ranks by total then name", async () => {
    const a = await mkUser("Alice");
    const b = await mkUser("Bob");
    const c = await mkUser("Cara");
    const d = await mkUser("Dan");
    const e1 = await mkEvent("e1", new Date("2026-11-10T12:00:00Z"));
    const e2 = await mkEvent("practice-1", new Date("2026-11-20T12:00:00Z"), { isPractice: true });
    await score(e1.id, a.id, { points: 150, bonus: 50 });
    await score(e2.id, a.id, { points: 50 });
    await score(e1.id, b.id, { points: 200 });
    await score(e1.id, c.id, { points: 200 });
    await score(e1.id, d.id, { points: 9999, disqualified: true });
    const rows = await seasonLeaderboard("2026-11");
    expect(rows).toEqual([
      { rank: 1, name: "Alice", points: 250 },
      { rank: 2, name: "Bob", points: 200 },
      { rank: 3, name: "Cara", points: 200 },
    ]);
  });

  it("uses WIB (UTC+7) for month boundaries", async () => {
    const a = await mkUser("Alice");
    // 2026-10-31T18:00Z = 2026-11-01 01:00 WIB -> November
    const nov = await mkEvent("nov", new Date("2026-10-31T18:00:00Z"));
    // 2026-11-30T17:30Z = 2026-12-01 00:30 WIB -> December
    const dec = await mkEvent("dec", new Date("2026-11-30T17:30:00Z"));
    await score(nov.id, a.id, { points: 10 });
    await score(dec.id, a.id, { points: 77 });
    expect(await seasonLeaderboard("2026-11")).toEqual([{ rank: 1, name: "Alice", points: 10 }]);
    expect(await seasonLeaderboard("2026-12")).toEqual([{ rank: 1, name: "Alice", points: 77 }]);
    expect(await seasonLeaderboard("2026-10")).toEqual([]);
  });

  it("rejects bad month strings and caps at 50", async () => {
    await expect(seasonLeaderboard("2026-13")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const ev = await mkEvent("big", new Date("2026-11-10T12:00:00Z"));
    const users = await Promise.all(Array.from({ length: 55 }, (_, i) => mkUser(`P${String(i).padStart(2, "0")}`)));
    await prisma.eventScore.createMany({ data: users.map((u, i) => ({ eventId: ev.id, userId: u.id, turnsPicked: 10, points: i })) });
    const rows = await seasonLeaderboard("2026-11");
    expect(rows).toHaveLength(50);
    expect(rows[0].points).toBe(54);
  });

  it("route returns public cache headers, 400 on bad month", async () => {
    const res = await boardGet(new Request("http://localhost:3000/api/leaderboard?month=2026-11"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=30, stale-while-revalidate=60");
    const bad = await boardGet(new Request("http://localhost:3000/api/leaderboard?month=nope"));
    expect(bad.status).toBe(400);
  });
});

describe("eventLeaderboard and csv", () => {
  it("ranks all rows, flags eligibility, short address fallback", async () => {
    const a = await mkUser("Alice");
    const b = await mkUser();
    const c = await mkUser("=cmd, \"x\"");
    const ev = await mkEvent("e1", new Date());
    await score(ev.id, a.id, { points: 100, bonus: 100, turnsPicked: 12 });
    await score(ev.id, b.id, { points: 150, turnsPicked: 3 });
    await score(ev.id, c.id, { points: 50, turnsPicked: 20, disqualified: true });
    const rows = await eventLeaderboard(ev.id);
    expect(rows.map((r) => [r.rank, r.points, r.eligible])).toEqual([[1, 200, true], [2, 150, false], [3, 50, false]]);
    expect(rows[1].name).toBe(`${b.address.slice(0, 6)}…${b.address.slice(-4)}`);
    const csv = leaderboardCsv(rows);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("rank,name,address,points,turnsPicked,eligible");
    expect(lines[1]).toBe(`1,Alice,${a.address},200,12,true`);
    expect(lines[2].endsWith(",150,3,false")).toBe(true);
    expect(lines[3]).toBe(`3,"'=cmd, ""x""",${c.address},50,20,false`);
  });
});
