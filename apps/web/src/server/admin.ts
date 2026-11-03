import { Prisma } from "@prisma/client";
import { z } from "zod";
import { INITIAL_FEN } from "@/game/types";
import { isPrizeEligible } from "@/game/scoring";
import { AppError } from "./errors";
import { prisma } from "./prisma";
import { requireUser } from "./session";

export async function requireAdmin(): Promise<{ userId: string; address: string }> {
  const s = await requireUser();
  const allowed = (process.env.ADMIN_ADDRESSES ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(s.address.toLowerCase())) throw new AppError("NOT_ADMIN", 403, "Admin only");
  return s;
}

const httpsUrl = z.string().url().max(300).refine((u) => u.startsWith("https://"), "must be an https URL");
const fields = {
  title: z.string().trim().min(3).max(80),
  slug: z.string().regex(/^[a-z0-9-]{3,48}$/),
  hostName: z.string().trim().min(2).max(50),
  startsAt: z.string().datetime({ offset: true }),
  bossLevel: z.number().int().min(1).max(5),
  maxCrowdMoves: z.number().int().min(10).max(60),
  sponsorName: z.string().trim().max(60).nullish(),
  sponsorLogoUrl: httpsUrl.nullish(),
  sponsorUrl: httpsUrl.nullish(),
  prizeText: z.string().trim().max(200).nullish(),
};

const CLOCK_SKEW_MS = 5 * 60_000;
const futureStart = (s: string) => new Date(s).getTime() >= Date.now() - CLOCK_SKEW_MS;
const BAD_START = "startsAt must be in the future";

export const createEventSchema = z.object({ ...fields, maxCrowdMoves: fields.maxCrowdMoves.default(30) });
export const updateEventSchema = z.object(fields).partial();

function assertSlug(slug: string): void {
  if (slug === "practice" || slug.startsWith("practice-")) throw new AppError("SLUG_RESERVED", 400, "Slug is reserved");
}

export async function listAdminEvents() {
  const events = await prisma.event.findMany({
    where: { isPractice: false },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { scores: true } } },
  });
  return events.map(({ _count, ...e }) => ({ ...e, playersCount: _count.scores }));
}

export async function createEvent(input: unknown) {
  const d = createEventSchema.parse(input);
  assertSlug(d.slug);
  if (!futureStart(d.startsAt)) throw new AppError("VALIDATION_ERROR", 400, `startsAt: ${BAD_START}`);
  if (await prisma.event.findUnique({ where: { slug: d.slug }, select: { id: true } })) {
    throw new AppError("SLUG_TAKEN", 409, "Slug already in use");
  }
  try {
    return await prisma.event.create({ data: { ...d, startsAt: new Date(d.startsAt), status: "SCHEDULED", fen: INITIAL_FEN } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw new AppError("SLUG_TAKEN", 409, "Slug already in use");
    throw e;
  }
}

const patchSchema = z.union([z.object({ action: z.literal("cancel") }), updateEventSchema.strict()]);

export async function patchEvent(id: string, input: unknown) {
  const d = patchSchema.parse(input);
  const ev = await prisma.event.findUnique({ where: { id } });
  if (!ev) throw new AppError("NOT_FOUND", 404, "Event not found");
  let data: Prisma.EventUpdateManyMutationInput;
  let statuses: string[];
  if ("action" in d) {
    statuses = ["SCHEDULED", "LIVE"];
    data = { status: "ABANDONED", result: null, finishedAt: new Date() };
  } else {
    if (ev.isPractice) throw new AppError("EVENT_LOCKED", 409, "Practice events cannot be edited");
    if (d.slug !== undefined) {
      assertSlug(d.slug);
      const other = await prisma.event.findUnique({ where: { slug: d.slug }, select: { id: true } });
      if (other && other.id !== id) throw new AppError("SLUG_TAKEN", 409, "Slug already in use");
    }
    if (d.startsAt !== undefined && !futureStart(d.startsAt)) throw new AppError("VALIDATION_ERROR", 400, `startsAt: ${BAD_START}`);
    const { startsAt, ...rest } = d;
    statuses = ["SCHEDULED"];
    data = { ...rest, ...(startsAt ? { startsAt: new Date(startsAt) } : {}) };
  }
  // The status condition is part of the write, so a concurrent start/finish cannot be overwritten.
  let res;
  try {
    res = await prisma.event.updateMany({ where: { id, status: { in: statuses } }, data });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw new AppError("SLUG_TAKEN", 409, "Slug already in use");
    throw e;
  }
  if (res.count !== 1) throw new AppError("EVENT_LOCKED", 409, "Event status changed; action not allowed");
  return prisma.event.findUniqueOrThrow({ where: { id } });
}

export async function assertEventExists(id: string): Promise<void> {
  if (!(await prisma.event.findUnique({ where: { id }, select: { id: true } }))) throw new AppError("NOT_FOUND", 404, "Event not found");
}

const scoreActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["disqualify", "reinstate", "markPaid", "unmarkPaid"]),
});

export async function updateScore(eventId: string, input: unknown): Promise<void> {
  const { userId, action } = scoreActionSchema.parse(input);
  const key = { eventId_userId: { eventId, userId } };
  const row = await prisma.eventScore.findUnique({ where: key });
  if (!row) throw new AppError("NOT_FOUND", 404, "Score not found");
  if (action === "disqualify") {
    await prisma.eventScore.update({ where: key, data: { disqualified: true, prizePaidAt: null } });
  } else if (action === "reinstate") {
    await prisma.eventScore.update({ where: key, data: { disqualified: false } });
  } else if (action === "unmarkPaid") {
    await prisma.eventScore.update({ where: key, data: { prizePaidAt: null } });
  } else {
    if (!isPrizeEligible(row.turnsPicked, row.disqualified)) throw new AppError("NOT_ELIGIBLE", 409, "Player is not prize eligible");
    await prisma.eventScore.update({ where: key, data: { prizePaidAt: new Date() } });
  }
}

export async function listLeads(unhandledOnly: boolean) {
  return prisma.lead.findMany({ where: unhandledOnly ? { handledAt: null } : {}, orderBy: { createdAt: "desc" } });
}

const handledSchema = z.object({ id: z.string().min(1), handled: z.boolean() });

export async function setLeadHandled(input: unknown): Promise<void> {
  const { id, handled } = handledSchema.parse(input);
  if (!(await prisma.lead.findUnique({ where: { id }, select: { id: true } }))) throw new AppError("NOT_FOUND", 404, "Lead not found");
  await prisma.lead.update({ where: { id }, data: { handledAt: handled ? new Date() : null } });
}
