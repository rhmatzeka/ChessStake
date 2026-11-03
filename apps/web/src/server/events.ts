import { Prisma, type Event, type Turn } from "@prisma/client";
import { analyse, bossMove } from "@/game/engine";
import { selectCandidates } from "@/game/candidates";
import { eventBonus, pickPoints } from "@/game/scoring";
import { applyMove, bossGameOver, choosePlayedMove, crowdGameOver, nextStatusAfterTurn } from "@/game/rules";
import { INITIAL_FEN } from "@/game/types";
import type { BossLevel, Candidate, EventResult, EventStatus, PickTally } from "@/game/types";
import { AppError } from "./errors";
import { prisma } from "./prisma";

const TURN_MS = 15_000;
const BOSS_DELAY_MS = 2_000;
const CLAIM_TTL_MS = 30_000;
const PRACTICE_RESTART_MS = 30_000;
/** A failed resolve stays claimed but becomes re-claimable after this long (CLAIM_TTL_MS - RETRY_BACKOFF_MS). */
const RETRY_BACKOFF_MS = 5_000;
/** A LIVE event with no turn is only repaired by a reader after this long; the starter normally does it. */
const NO_TURN_GRACE_MS = 10_000;
const HISTORY_LIMIT = 40;
const PRACTICE_SLUG = "practice";

function budgetMs(): number {
  return Number(process.env.PAWNPOOL_ENGINE_BUDGET_MS) || 900;
}

export type PublicCandidate = Omit<Candidate, "quality" | "cpLoss" | "evalCp">;

export type PublicState = {
  slug: string;
  title: string;
  hostName: string;
  sponsor: { name: string; logoUrl: string | null; url: string | null; prizeText: string | null } | null;
  bossLevel: number;
  status: EventStatus;
  result: EventResult | null;
  isPractice: boolean;
  fen: string;
  lastMove: { uci: string; san: string; by: "crowd" | "boss" } | null;
  turn: {
    number: number;
    opensAt: string;
    endsAt: string;
    candidates: PublicCandidate[];
    tally: { uci: string; count: number }[];
  } | null;
  history: { number: number; crowdSan: string; bossSan: string | null; candidates: Candidate[] }[];
  top: { name: string; points: number }[];
  playersOnline: number;
  startsAt: string;
  serverNow: string;
};

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Thrown inside the resolve transaction when our claim was taken over; rolls everything back. */
class LostClaim extends Error {}

/** `practice` is an alias for the newest practice round (practice-1, practice-2, ...). */
async function findEvent(slug: string): Promise<Event | null> {
  if (slug !== PRACTICE_SLUG) return prisma.event.findUnique({ where: { slug } });
  const latest = await prisma.event.findFirst({
    where: { isPractice: true },
    orderBy: [{ createdAt: "desc" }, { slug: "desc" }],
  });
  if (latest) return latest;
  await createPracticeEvent(1);
  return prisma.event.findFirst({ where: { isPractice: true }, orderBy: { createdAt: "desc" } });
}

/** Creates a practice round plus its turn 1; the unique slug means only one caller does either. Returns true if we created it. */
async function createPracticeEvent(n: number): Promise<boolean> {
  try {
    const created = await prisma.event.create({
      data: {
        slug: `practice-${n}`,
        title: "Practice Arena",
        hostName: "PawnPool",
        bossLevel: 2,
        maxCrowdMoves: 30,
        startsAt: new Date(),
        status: "LIVE",
        fen: INITIAL_FEN,
        isPractice: true,
        startedAt: new Date(),
      },
    });
    await createTurn(created, 1, new Date());
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

/** Analyses the position and stores the next turn. Returns false if no turn was created. */
async function createTurn(event: Pick<Event, "id" | "fen">, number: number, opensAt: Date): Promise<boolean> {
  const lines = await analyse(event.fen, { lines: 8, budgetMs: budgetMs() });
  if (lines.length < 1) {
    // No legal moves: the game is already over.
    await prisma.event.updateMany({
      where: { id: event.id, status: "LIVE" },
      data: { status: "FINISHED", result: bossGameOver(event.fen) ?? "SURVIVED", finishedAt: new Date() },
    });
    return false;
  }
  const candidates = selectCandidates(event.fen, lines, `${event.id}:${number}`);
  try {
    await prisma.turn.create({
      data: {
        eventId: event.id,
        number,
        status: "OPEN",
        opensAt,
        endsAt: new Date(opensAt.getTime() + TURN_MS),
        fenBefore: event.fen,
        candidates: candidates as unknown as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

/** Advances an event lazily. Returns true if this call changed something. */
async function progress(ev: Event): Promise<boolean> {
  const now = new Date();
  if (ev.status === "SCHEDULED") {
    if (ev.startsAt > now) return false;
    const claim = await prisma.event.updateMany({
      where: { id: ev.id, status: "SCHEDULED", startsAt: { lte: now } },
      data: { status: "LIVE", startedAt: now },
    });
    if (claim.count !== 1) return true; // someone else won the start and computes turn 1
    await createTurn(ev, 1, now);
    return true;
  }
  if (ev.status === "LIVE") {
    const latest = await prisma.turn.findFirst({ where: { eventId: ev.id }, orderBy: { number: "desc" } });
    if (!latest) {
      // The starter normally creates turn 1 right away. Only repair after a grace period, and let
      // exactly one reader do it by moving startedAt forward (conditional update).
      const ref = ev.startedAt ?? ev.createdAt;
      if (now.getTime() - ref.getTime() <= NO_TURN_GRACE_MS) return false;
      const repair = await prisma.event.updateMany({
        where: { id: ev.id, status: "LIVE", startedAt: ev.startedAt },
        data: { startedAt: now },
      });
      if (repair.count !== 1) return false;
      await createTurn(ev, 1, now);
      return true;
    }
    if (latest.status === "RESOLVED") {
      // Crash recovery: the resolve transaction normally creates the next turn itself.
      await createTurn(ev, latest.number + 1, new Date(now.getTime() + BOSS_DELAY_MS));
      return true;
    }
    if (latest.status === "OPEN" && latest.endsAt <= now) return resolveTurn(ev.id, latest.number);
    if (latest.status === "RESOLVING" && latest.claimedAt && latest.claimedAt.getTime() < now.getTime() - CLAIM_TTL_MS) {
      return resolveTurn(ev.id, latest.number);
    }
    return false;
  }
  if (ev.isPractice && ev.finishedAt && ev.finishedAt.getTime() <= now.getTime() - PRACTICE_RESTART_MS) {
    const newest = await prisma.event.findFirst({
      where: { isPractice: true },
      orderBy: [{ createdAt: "desc" }, { slug: "desc" }],
    });
    if (!newest || newest.id !== ev.id) return false;
    const n = Number(/^practice-(\d+)$/.exec(ev.slug)?.[1] ?? 0) + 1;
    await createPracticeEvent(n);
    return true;
  }
  return false;
}

/** Lazy start, resolve an expired turn, practice restart. Safe to call from many requests at once. */
export async function progressEvent(eventId: string): Promise<boolean> {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  return ev ? progress(ev) : false;
}

/** Cron entry point: progresses every LIVE event, due SCHEDULED events and the latest practice round. Returns how many changed. */
export async function progressAllEvents(): Promise<number> {
  const now = new Date();
  const [due, practice] = await Promise.all([
    prisma.event.findMany({
      where: { OR: [{ status: "LIVE" }, { status: "SCHEDULED", startsAt: { lte: now } }] },
      select: { id: true },
    }),
    prisma.event.findFirst({ where: { isPractice: true }, orderBy: [{ createdAt: "desc" }, { slug: "desc" }], select: { id: true } }),
  ]);
  const ids = new Set(due.map((e) => e.id));
  if (practice) ids.add(practice.id);
  let n = 0;
  for (const id of ids) {
    try {
      if (await progressEvent(id)) n++;
    } catch (e) {
      console.error(`cron progress failed for event ${id}:`, e);
    }
  }
  return n;
}

export type LobbyItem = {
  slug: string;
  title: string;
  hostName: string;
  sponsorName: string | null;
  bossLevel: number;
  status: EventStatus;
  result: EventResult | null;
  startsAt: string;
  isPractice: boolean;
  playersCount: number;
  top3: { name: string; points: number }[];
};

type LobbyRow = Event & { _count: { scores: number } };

function toLobbyItem(e: LobbyRow, top3: LobbyItem["top3"] = []): LobbyItem {
  return {
    slug: e.isPractice ? PRACTICE_SLUG : e.slug,
    title: e.title,
    hostName: e.hostName,
    sponsorName: e.sponsorName,
    bossLevel: e.bossLevel,
    status: e.status as EventStatus,
    result: e.result as EventResult | null,
    startsAt: e.startsAt.toISOString(),
    isPractice: e.isPractice,
    playersCount: e._count.scores,
    top3,
  };
}

export async function listEvents(): Promise<{ live: LobbyItem[]; upcoming: LobbyItem[]; past: LobbyItem[] }> {
  const count = { select: { scores: true } } as const;
  const [live, upcoming, past, practice] = await Promise.all([
    prisma.event.findMany({ where: { status: "LIVE", isPractice: false }, orderBy: { startsAt: "asc" }, include: { _count: count } }),
    prisma.event.findMany({ where: { status: "SCHEDULED", isPractice: false }, orderBy: { startsAt: "asc" }, include: { _count: count } }),
    prisma.event.findMany({
      where: { status: { in: ["FINISHED", "ABANDONED"] }, isPractice: false },
      orderBy: [{ finishedAt: "desc" }, { startsAt: "desc" }],
      take: 20,
      include: { _count: count },
    }),
    prisma.event.findFirst({ where: { isPractice: true }, orderBy: [{ createdAt: "desc" }, { slug: "desc" }], include: { _count: count } }),
  ]);

  const tops = new Map<string, LobbyItem["top3"]>();
  if (past.length) {
    const ids = past.map((e) => e.id);
    const rows = await prisma.$queryRaw<{ eventId: string; address: string; displayName: string | null; total: number }[]>`
      SELECT "eventId", "address", "displayName", "total" FROM (
        SELECT s."eventId" AS "eventId", u."address" AS "address", u."displayName", (s."points" + s."bonus")::int AS "total",
               ROW_NUMBER() OVER (PARTITION BY s."eventId" ORDER BY (s."points" + s."bonus") DESC, u."address" ASC) AS "rn"
        FROM "EventScore" s JOIN "User" u ON u."id" = s."userId"
        WHERE s."eventId" IN (${Prisma.join(ids)}) AND NOT s."disqualified"
      ) t WHERE "rn" <= 3 ORDER BY "eventId", "rn"`;
    for (const r of rows) {
      const list = tops.get(r.eventId) ?? [];
      list.push({ name: r.displayName ?? shortAddress(r.address), points: r.total });
      tops.set(r.eventId, list);
    }
  }

  return {
    live: [...live.map((e) => toLobbyItem(e)), ...(practice ? [toLobbyItem(practice)] : [])],
    upcoming: upcoming.map((e) => toLobbyItem(e)),
    past: past.map((e) => toLobbyItem(e, tops.get(e.id) ?? [])),
  };
}

/**
 * Resolves a turn if this call wins the claim. Engine work happens after the claim and outside any
 * transaction; every result is then written in one transaction. Returns false if someone else won.
 */
export async function resolveTurn(eventId: string, turnNumber: number): Promise<boolean> {
  const claimedAt = new Date();
  const claim = await prisma.turn.updateMany({
    where: {
      eventId,
      number: turnNumber,
      OR: [
        { status: "OPEN", endsAt: { lte: claimedAt } },
        { status: "RESOLVING", claimedAt: { lt: new Date(claimedAt.getTime() - CLAIM_TTL_MS) } },
      ],
    },
    data: { status: "RESOLVING", claimedAt },
  });
  if (claim.count !== 1) return false;

  try {
    return await resolveClaimed(eventId, turnNumber, claimedAt);
  } catch (e) {
    // Release with a backoff: stay RESOLVING but pretend the claim is old enough that it can be
    // re-claimed after RETRY_BACKOFF_MS. Guarded by claimedAt so we never touch someone else's claim.
    await prisma.turn
      .updateMany({
        where: { eventId, number: turnNumber, status: "RESOLVING", claimedAt },
        data: { claimedAt: new Date(Date.now() - (CLAIM_TTL_MS - RETRY_BACKOFF_MS)) },
      })
      .catch(() => undefined);
    throw e;
  }
}

async function resolveClaimed(eventId: string, turnNumber: number, claimedAt: Date): Promise<boolean> {
  const [ev, turn, groups] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id: eventId } }),
    prisma.turn.findUniqueOrThrow({ where: { eventId_number: { eventId, number: turnNumber } } }),
    prisma.pick.groupBy({
      by: ["uci"],
      where: { eventId, turnNumber },
      _count: { _all: true },
      _min: { updatedAt: true },
    }),
  ]);
  const candidates = turn.candidates as unknown as Candidate[];
  const tally: PickTally = groups.map((g) => ({
    uci: g.uci,
    count: g._count._all,
    firstAt: g._min.updatedAt?.getTime() ?? 0,
  }));

  const { uci, zeroPick } = choosePlayedMove(candidates, tally);
  const crowd = applyMove(ev.fen, uci);
  let fenAfter = crowd.fen;
  let boss: { uci: string; san: string } | null = null;
  let ended = crowdGameOver(crowd.fen);
  if (!ended) {
    const bossUci = await bossMove(crowd.fen, ev.bossLevel as BossLevel);
    const reply = applyMove(crowd.fen, bossUci);
    boss = { uci: bossUci, san: reply.san };
    fenAfter = reply.fen;
    ended = bossGameOver(fenAfter);
  }
  const emptyTurnStreak = zeroPick ? ev.emptyTurnStreak + 1 : 0;
  const crowdMoveNumber = ev.crowdMoveNumber + 1;
  let next = nextStatusAfterTurn({
    ended,
    crowdMoveNumber,
    maxCrowdMoves: ev.maxCrowdMoves,
    // The practice arena is always on: empty turns never abandon it.
    emptyStreak: ev.isPractice ? 0 : emptyTurnStreak,
  });

  let nextCandidates: Candidate[] | null = null;
  if (next.status === "LIVE") {
    const lines = await analyse(fenAfter, { lines: 8, budgetMs: budgetMs() });
    if (lines.length < 1) next = { status: "FINISHED", result: bossGameOver(fenAfter) ?? "SURVIVED" };
    else nextCandidates = selectCandidates(fenAfter, lines, `${eventId}:${turnNumber + 1}`);
  }

  const resolvedAt = new Date();
  try {
    await prisma.$transaction(
      async (tx) => {
        const done = await tx.turn.updateMany({
          where: { id: turn.id, status: "RESOLVING", claimedAt },
          data: {
            status: "RESOLVED",
            chosenUci: uci,
            crowdSan: crowd.san,
            bossReplyUci: boss?.uci ?? null,
            bossReplySan: boss?.san ?? null,
            fenAfter,
            resolvedAt,
          },
        });
        if (done.count !== 1) throw new LostClaim();

        for (const c of candidates) {
          await tx.pick.updateMany({
            where: { eventId, turnNumber, uci: c.uci },
            data: { points: pickPoints(c.cpLoss) },
          });
        }
        await tx.$executeRaw`
          INSERT INTO "EventScore" ("eventId", "userId", "turnsPicked", "points", "bonus", "disqualified")
          SELECT "eventId", "userId", 1, COALESCE("points", 0), 0, false
          FROM "Pick" WHERE "eventId" = ${eventId} AND "turnNumber" = ${turnNumber}
          ON CONFLICT ("eventId", "userId") DO UPDATE SET
            "turnsPicked" = "EventScore"."turnsPicked" + 1,
            "points" = "EventScore"."points" + EXCLUDED."points"`;

        if (next.status === "FINISHED" && next.result) {
          const byTurns = await tx.eventScore.groupBy({ by: ["turnsPicked"], where: { eventId } });
          for (const g of byTurns) {
            const bonus = eventBonus(next.result, g.turnsPicked);
            if (bonus > 0) {
              await tx.eventScore.updateMany({
                where: { eventId, turnsPicked: g.turnsPicked },
                data: { bonus: { increment: bonus } },
              });
            }
          }
        }

        // Guard against an admin cancel that landed while this turn was RESOLVING: abort and roll back.
        const upd = await tx.event.updateMany({
          where: { id: eventId, status: "LIVE" },
          data: {
            fen: fenAfter,
            crowdMoveNumber,
            emptyTurnStreak,
            status: next.status,
            result: next.result,
            finishedAt: next.status === "LIVE" ? null : resolvedAt,
          },
        });
        if (upd.count !== 1) throw new LostClaim();

        if (nextCandidates) {
          const opensAt = new Date(resolvedAt.getTime() + BOSS_DELAY_MS);
          await tx.turn.create({
            data: {
              eventId,
              number: turnNumber + 1,
              status: "OPEN",
              opensAt,
              endsAt: new Date(opensAt.getTime() + TURN_MS),
              fenBefore: fenAfter,
              candidates: nextCandidates as unknown as Prisma.InputJsonValue,
            },
          });
        }
      },
      { timeout: 20_000, maxWait: 10_000 },
    );
  } catch (e) {
    if (e instanceof LostClaim) return false;
    throw e;
  }
  return true;
}

export async function submitPick(slug: string, userId: string, turnNumber: number, uci: string): Promise<void> {
  const ev = await findEvent(slug);
  if (!ev) throw new AppError("EVENT_NOT_FOUND", 404);
  if (ev.status !== "LIVE") throw new AppError("EVENT_NOT_LIVE", 409);
  const turn = await prisma.turn.findFirst({ where: { eventId: ev.id }, orderBy: { number: "desc" } });
  const now = new Date();
  if (!turn || turn.number !== turnNumber || turn.status !== "OPEN" || now >= turn.endsAt) {
    throw new AppError("TURN_CLOSED", 409);
  }
  if (now < turn.opensAt) throw new AppError("TURN_NOT_OPEN_YET", 409);
  const candidates = turn.candidates as unknown as Candidate[];
  if (!candidates.some((c) => c.uci === uci)) throw new AppError("NOT_A_CANDIDATE", 400);
  await prisma.pick.upsert({
    where: { eventId_turnNumber_userId: { eventId: ev.id, turnNumber, userId } },
    create: { eventId: ev.id, turnNumber, userId, uci, createdAt: now, updatedAt: now },
    update: { uci, updatedAt: now },
  });
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export async function getPublicState(slug: string): Promise<PublicState> {
  let ev = await findEvent(slug);
  if (!ev) throw new AppError("EVENT_NOT_FOUND", 404);
  let changed = false;
  try {
    changed = await progress(ev);
  } catch (e) {
    // Never fail a read because advancing the game failed; serve the current state and retry later.
    console.error(`progress failed for event ${ev.id} (${ev.slug}), turn after ${ev.crowdMoveNumber}:`, e);
  }
  if (changed || slug === PRACTICE_SLUG) ev = (await findEvent(slug)) ?? ev;
  const eventId = ev.id;

  const [latest, resolved, top, online] = await Promise.all([
    prisma.turn.findFirst({ where: { eventId }, orderBy: { number: "desc" } }),
    prisma.turn.findMany({
      where: { eventId, status: "RESOLVED" },
      orderBy: { number: "desc" },
      take: HISTORY_LIMIT,
      select: {
        number: true,
        crowdSan: true,
        bossReplySan: true,
        bossReplyUci: true,
        chosenUci: true,
        candidates: true,
      },
    }),
    prisma.$queryRaw<{ address: string; displayName: string | null; total: number }[]>`
      SELECT u."address", u."displayName", (s."points" + s."bonus")::int AS total
      FROM "EventScore" s JOIN "User" u ON u."id" = s."userId"
      WHERE s."eventId" = ${eventId} AND NOT s."disqualified"
      ORDER BY total DESC, u."address" ASC LIMIT 10`,
    prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT "userId") AS n FROM "Pick"
      WHERE "eventId" = ${eventId} AND "turnNumber" >= ${ev.crowdMoveNumber - 1}`,
  ]);

  const openTurn: Turn | null = latest && latest.status !== "RESOLVED" ? latest : null;
  const tally = openTurn
    ? await prisma.pick.groupBy({
        by: ["uci"],
        where: { eventId, turnNumber: openTurn.number },
        _count: { _all: true },
      })
    : [];

  const last = resolved[0];
  let lastMove: PublicState["lastMove"] = null;
  if (last?.bossReplyUci) lastMove = { uci: last.bossReplyUci, san: last.bossReplySan ?? "", by: "boss" };
  else if (last?.chosenUci) lastMove = { uci: last.chosenUci, san: last.crowdSan ?? "", by: "crowd" };

  return {
    slug: ev.slug,
    title: ev.title,
    hostName: ev.hostName,
    sponsor: ev.sponsorName
      ? { name: ev.sponsorName, logoUrl: ev.sponsorLogoUrl, url: ev.sponsorUrl, prizeText: ev.prizeText }
      : null,
    bossLevel: ev.bossLevel,
    status: ev.status as EventStatus,
    result: ev.result as EventResult | null,
    isPractice: ev.isPractice,
    fen: ev.fen,
    lastMove,
    turn: openTurn
      ? {
          number: openTurn.number,
          opensAt: openTurn.opensAt.toISOString(),
          endsAt: openTurn.endsAt.toISOString(),
          candidates: (openTurn.candidates as unknown as Candidate[]).map(({ uci, san, label }) => ({ uci, san, label })),
          tally: tally.map((t) => ({ uci: t.uci, count: t._count._all })),
        }
      : null,
    history: resolved.map((t) => ({
      number: t.number,
      crowdSan: t.crowdSan ?? "",
      bossSan: t.bossReplySan,
      candidates: t.candidates as unknown as Candidate[],
    })),
    top: top.map((r) => ({ name: r.displayName ?? shortAddress(r.address), points: r.total })),
    playersOnline: Number(online[0]?.n ?? 0),
    startsAt: ev.startsAt.toISOString(),
    serverNow: new Date().toISOString(),
  };
}

/** Points are the event total (pick points plus end bonus); rank counts non-disqualified players only. */
export async function getMyState(
  slug: string,
  userId: string,
): Promise<{ pickUci: string | null; points: number; turnsPicked: number; rank: number | null }> {
  const ev = await findEvent(slug);
  if (!ev) throw new AppError("EVENT_NOT_FOUND", 404);
  const [latest, score] = await Promise.all([
    prisma.turn.findFirst({ where: { eventId: ev.id }, orderBy: { number: "desc" }, select: { number: true, status: true } }),
    prisma.eventScore.findUnique({ where: { eventId_userId: { eventId: ev.id, userId } } }),
  ]);
  const pick =
    latest && latest.status !== "RESOLVED"
      ? await prisma.pick.findUnique({
          where: { eventId_turnNumber_userId: { eventId: ev.id, turnNumber: latest.number, userId } },
          select: { uci: true },
        })
      : null;
  let rank: number | null = null;
  if (score && !score.disqualified) {
    const total = score.points + score.bonus;
    const ahead = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM "EventScore"
      WHERE "eventId" = ${ev.id} AND NOT "disqualified" AND ("points" + "bonus") > ${total}`;
    rank = Number(ahead[0]?.n ?? 0) + 1;
  }
  return {
    pickUci: pick?.uci ?? null,
    points: score ? score.points + score.bonus : 0,
    turnsPicked: score?.turnsPicked ?? 0,
    rank,
  };
}
