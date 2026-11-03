import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/prisma";
import { AppError } from "@/server/errors";
import { getMyState, getPublicState, progressEvent, resolveTurn, submitPick } from "@/server/events";
import { INITIAL_FEN } from "@/game/types";
import { resetDatabase, truncateAll } from "@/test/db";

const PAST = () => new Date(Date.now() - 60_000);

async function mkUser(n: number) {
  return prisma.user.create({ data: { address: `0x${String(n).padStart(40, "0")}` } });
}

async function mkEvent(over: Record<string, unknown> = {}) {
  return prisma.event.create({
    data: {
      slug: "e1",
      title: "Test",
      hostName: "Host",
      bossLevel: 1,
      maxCrowdMoves: 30,
      startsAt: PAST(),
      fen: INITIAL_FEN,
      ...over,
    } as never,
  });
}

/** Pretends the open turn has run out. */
async function expire(eventId: string, number: number) {
  await prisma.turn.update({ where: { eventId_number: { eventId, number } }, data: { endsAt: PAST() } });
}

async function expectCode(p: Promise<unknown>, code: string, status: number) {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
  expect((err as AppError).status).toBe(status);
}

beforeAll(resetDatabase);
beforeEach(truncateAll);
afterAll(() => prisma.$disconnect());

describe("event lifecycle", () => {
  it("scheduled event goes LIVE on first read after startsAt", async () => {
    await mkEvent({ status: "SCHEDULED" });
    const s = await getPublicState("e1");
    expect(s.status).toBe("LIVE");
    expect(s.turn?.number).toBe(1);
    expect(s.turn!.candidates.length).toBeGreaterThanOrEqual(1);
    expect(s.turn!.candidates[0]).not.toHaveProperty("quality");
    expect(s.turn!.candidates[0]).not.toHaveProperty("cpLoss");
    expect(s.turn!.candidates[0]).not.toHaveProperty("evalCp");
    expect(Date.parse(s.turn!.endsAt) - Date.parse(s.turn!.opensAt)).toBe(15_000);
  });

  it("does not start before startsAt", async () => {
    await mkEvent({ status: "SCHEDULED", startsAt: new Date(Date.now() + 3_600_000) });
    const s = await getPublicState("e1");
    expect(s.status).toBe("SCHEDULED");
    expect(s.turn).toBeNull();
  });

  it("unknown slug is EVENT_NOT_FOUND", async () => {
    await expectCode(getPublicState("nope"), "EVENT_NOT_FOUND", 404);
  });

  it("pick then resolve plays most-picked move and Boss replies", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    const s1 = await getPublicState("e1");
    const [a, b] = s1.turn!.candidates;
    const users = await Promise.all([1, 2, 3].map(mkUser));
    await submitPick("e1", users[0]!.id, 1, a!.uci);
    await submitPick("e1", users[1]!.id, 1, b!.uci);
    await submitPick("e1", users[2]!.id, 1, b!.uci);
    await expire(ev.id, 1);
    const s2 = await getPublicState("e1");
    expect(s2.history).toHaveLength(1);
    expect(s2.history[0]!.crowdSan).toBe(b!.san);
    expect(s2.history[0]!.bossSan).toBeTruthy();
    expect(s2.history[0]!.candidates[0]).toHaveProperty("quality");
    expect(s2.turn?.number).toBe(2);
    expect(s2.lastMove?.by).toBe("boss");
    const after = await prisma.event.findUniqueOrThrow({ where: { id: ev.id } });
    expect(after.crowdMoveNumber).toBe(1);
    expect(after.emptyTurnStreak).toBe(0);
    const t2 = Date.parse(s2.turn!.opensAt) - Date.parse(s2.serverNow);
    expect(t2).toBeGreaterThan(1_000);
    expect(t2).toBeLessThanOrEqual(2_100);
  });

  it("last pick in a turn counts", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    const s1 = await getPublicState("e1");
    const [a, b] = s1.turn!.candidates;
    const [u] = await Promise.all([mkUser(1)]);
    await submitPick("e1", u!.id, 1, a!.uci);
    await submitPick("e1", u!.id, 1, b!.uci);
    expect(await prisma.pick.count()).toBe(1);
    expect((await getMyState("e1", u!.id)).pickUci).toBe(b!.uci);
    await expire(ev.id, 1);
    const s2 = await getPublicState("e1");
    expect(s2.history[0]!.crowdSan).toBe(b!.san);
  });

  it("rejects pick for a turn that already rolled over", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    const s1 = await getPublicState("e1");
    const u = await mkUser(1);
    await expire(ev.id, 1);
    await getPublicState("e1");
    await expectCode(submitPick("e1", u.id, 1, s1.turn!.candidates[0]!.uci), "TURN_CLOSED", 409);
  });

  it("rejects pick for an expired turn that nobody resolved yet", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    const s1 = await getPublicState("e1");
    const u = await mkUser(1);
    await expire(ev.id, 1);
    await expectCode(submitPick("e1", u.id, 1, s1.turn!.candidates[0]!.uci), "TURN_CLOSED", 409);
  });

  it("rejects pick before opensAt", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    const s1 = await getPublicState("e1");
    const u = await mkUser(1);
    await prisma.turn.update({
      where: { eventId_number: { eventId: ev.id, number: 1 } },
      data: { opensAt: new Date(Date.now() + 5_000), endsAt: new Date(Date.now() + 20_000) },
    });
    await expectCode(submitPick("e1", u.id, 1, s1.turn!.candidates[0]!.uci), "TURN_NOT_OPEN_YET", 409);
  });

  it("rejects non-candidate moves, non-live events", async () => {
    await mkEvent({ status: "SCHEDULED" });
    await mkEvent({ slug: "later", status: "SCHEDULED", startsAt: new Date(Date.now() + 3_600_000) });
    await getPublicState("e1");
    const u = await mkUser(1);
    await expectCode(submitPick("e1", u.id, 1, "a1a2"), "NOT_A_CANDIDATE", 400);
    await expectCode(submitPick("later", u.id, 1, "e2e4"), "EVENT_NOT_LIVE", 409);
    await expectCode(submitPick("zzz", u.id, 1, "e2e4"), "EVENT_NOT_FOUND", 404);
  });

  it("concurrent resolve produces one move", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    await getPublicState("e1");
    await expire(ev.id, 1);
    const states = await Promise.all(Array.from({ length: 10 }, () => getPublicState("e1")));
    expect(states).toHaveLength(10);
    const turns = await prisma.turn.findMany({ where: { eventId: ev.id }, orderBy: { number: "asc" } });
    expect(turns.map((t) => t.number)).toEqual([1, 2]);
    expect(turns[0]!.status).toBe("RESOLVED");
    expect(turns[0]!.bossReplyUci).toBeTruthy();
    const after = await prisma.event.findUniqueOrThrow({ where: { id: ev.id } });
    expect(after.crowdMoveNumber).toBe(1);
    expect(after.emptyTurnStreak).toBe(1);
  });

  it("resolveTurn returns false when another request holds the claim, recovers a stale claim", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    await getPublicState("e1");
    await expire(ev.id, 1);
    await prisma.turn.update({
      where: { eventId_number: { eventId: ev.id, number: 1 } },
      data: { status: "RESOLVING", claimedAt: new Date() },
    });
    expect(await resolveTurn(ev.id, 1)).toBe(false);
    await prisma.turn.update({
      where: { eventId_number: { eventId: ev.id, number: 1 } },
      data: { claimedAt: new Date(Date.now() - 31_000) },
    });
    await progressEvent(ev.id);
    const t = await prisma.turn.findMany({ where: { eventId: ev.id }, orderBy: { number: "asc" } });
    expect(t.map((x) => x.status)).toEqual(["RESOLVED", "OPEN"]);
  });

  it("creates the next turn when a LIVE event has none", async () => {
    const ev = await mkEvent({ status: "LIVE" });
    await Promise.all([progressEvent(ev.id), progressEvent(ev.id), progressEvent(ev.id)]);
    expect(await prisma.turn.count({ where: { eventId: ev.id } })).toBe(1);
  });

  it("points and end bonus land in EventScore", async () => {
    const ev = await mkEvent({ status: "SCHEDULED", maxCrowdMoves: 5 });
    const u = await mkUser(1);
    let expectedPoints = 0;
    let state = await getPublicState("e1");
    for (let n = 1; n <= 5; n++) {
      expect(state.turn?.number).toBe(n);
      const c = state.turn!.candidates[0]!;
      await prisma.turn.update({ where: { eventId_number: { eventId: ev.id, number: n } }, data: { opensAt: PAST() } });
      await submitPick("e1", u.id, n, c.uci);
      await expire(ev.id, n);
      state = await getPublicState("e1");
      const full = state.history[0]!.candidates.find((x) => x.uci === c.uci)!;
      expectedPoints += Math.max(10, Math.round(110 - full.cpLoss / 3));
    }
    expect(state.status).toBe("FINISHED");
    expect(state.result).toBe("SURVIVED");
    expect(state.turn).toBeNull();
    const score = await prisma.eventScore.findUniqueOrThrow({
      where: { eventId_userId: { eventId: ev.id, userId: u.id } },
    });
    expect(score.turnsPicked).toBe(5);
    expect(score.points).toBe(expectedPoints);
    expect(score.bonus).toBe(200);
    expect(score.disqualified).toBe(false);
    const picks = await prisma.pick.findMany({ where: { userId: u.id } });
    expect(picks.every((p) => p.points !== null && p.points >= 10)).toBe(true);
    expect(state.top[0]).toEqual({ name: "0x0000…0001", points: expectedPoints + 200 });
    expect(state.playersOnline).toBe(1);
    const me = await getMyState("e1", u.id);
    expect(me).toMatchObject({ points: expectedPoints + 200, turnsPicked: 5, rank: 1 });
    const fin = await prisma.event.findUniqueOrThrow({ where: { id: ev.id } });
    expect(fin.finishedAt).not.toBeNull();
  });

  it("five empty turns abandon the event without bonus", async () => {
    const ev = await mkEvent({ status: "SCHEDULED" });
    await getPublicState("e1");
    for (let n = 1; n <= 5; n++) {
      await expire(ev.id, n);
      await getPublicState("e1");
    }
    const after = await prisma.event.findUniqueOrThrow({ where: { id: ev.id } });
    expect(after.status).toBe("ABANDONED");
    expect(after.finishedAt).not.toBeNull();
    expect(after.result).toBeNull();
  });
});

describe("practice arena", () => {
  it("slug practice aliases the latest practice event and creates practice-1 if none", async () => {
    const s = await getPublicState("practice");
    expect(s.isPractice).toBe(true);
    expect(s.slug).toBe("practice-1");
    expect(s.status).toBe("LIVE");
    expect(s.bossLevel).toBe(2);
    expect(s.turn?.number).toBe(1);
  });

  it("does not restart before 30 s, restarts after", async () => {
    await getPublicState("practice");
    const p1 = await prisma.event.findUniqueOrThrow({ where: { slug: "practice-1" } });
    await prisma.event.update({
      where: { id: p1.id },
      data: { status: "FINISHED", result: "SURVIVED", finishedAt: new Date(Date.now() - 10_000) },
    });
    expect((await getPublicState("practice")).slug).toBe("practice-1");
    await prisma.event.update({ where: { id: p1.id }, data: { finishedAt: new Date(Date.now() - 31_000) } });
    const s = await getPublicState("practice");
    expect(s.slug).toBe("practice-2");
    expect(s.status).toBe("LIVE");
    expect(s.turn?.number).toBe(1);
  });

  it("concurrent practice restart creates one event", async () => {
    await getPublicState("practice");
    await prisma.event.update({
      where: { slug: "practice-1" },
      data: { status: "ABANDONED", finishedAt: new Date(Date.now() - 31_000) },
    });
    const states = await Promise.all(Array.from({ length: 8 }, () => getPublicState("practice")));
    expect(new Set(states.map((s) => s.slug))).toEqual(new Set(["practice-2"]));
    expect(await prisma.event.count({ where: { isPractice: true } })).toBe(2);
    expect(await prisma.turn.count({ where: { event: { slug: "practice-2" } } })).toBe(1);
  });
});
