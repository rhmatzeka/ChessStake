import { isPrizeEligible } from "@/game/scoring";
import { AppError } from "./errors";
import { prisma } from "./prisma";

const WIB_OFFSET_MS = 7 * 3_600_000;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export type SeasonRow = { rank: number; name: string; points: number };
export type EventRow = {
  rank: number;
  userId: string;
  name: string;
  address: string;
  points: number;
  turnsPicked: number;
  eligible: boolean;
  disqualified: boolean;
  prizePaidAt: Date | null;
};

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Current month as YYYY-MM in WIB (UTC+7). */
export function currentWibMonth(now = Date.now()): string {
  return new Date(now + WIB_OFFSET_MS).toISOString().slice(0, 7);
}

export function parseMonth(month: string): { start: Date; end: Date } {
  if (!MONTH_RE.test(month)) throw new AppError("VALIDATION_ERROR", 400, "month must be YYYY-MM");
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1) - WIB_OFFSET_MS),
    end: new Date(Date.UTC(y, m, 1) - WIB_OFFSET_MS),
  };
}

/** Top 50 for a WIB month: sums points+bonus of non-disqualified rows, practice events included. */
export async function seasonLeaderboard(month: string): Promise<SeasonRow[]> {
  const { start, end } = parseMonth(month);
  const rows = await prisma.eventScore.findMany({
    where: { disqualified: false, event: { startsAt: { gte: start, lt: end } } },
    select: { userId: true, points: true, bonus: true, user: { select: { address: true, displayName: true } } },
  });
  const totals = new Map<string, { name: string; points: number }>();
  for (const r of rows) {
    const t = totals.get(r.userId) ?? { name: r.user.displayName ?? shortAddress(r.user.address), points: 0 };
    t.points += r.points + r.bonus;
    totals.set(r.userId, t);
  }
  return [...totals.values()]
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, 50)
    .map((t, i) => ({ rank: i + 1, name: t.name, points: t.points }));
}

/** All rows of one event ranked by points+bonus. */
export async function eventLeaderboard(eventId: string): Promise<EventRow[]> {
  const rows = await prisma.eventScore.findMany({
    where: { eventId },
    include: { user: { select: { address: true, displayName: true } } },
  });
  return rows
    .map((r) => ({
      userId: r.userId,
      name: r.user.displayName ?? shortAddress(r.user.address),
      address: r.user.address,
      points: r.points + r.bonus,
      turnsPicked: r.turnsPicked,
      eligible: isPrizeEligible(r.turnsPicked, r.disqualified),
      disqualified: r.disqualified,
      prizePaidAt: r.prizePaidAt,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .map((r, i) => ({ rank: i + 1, ...r }));
}

function cell(v: string | number | boolean): string {
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function leaderboardCsv(rows: EventRow[]): string {
  const lines = ["rank,name,address,points,turnsPicked,eligible"];
  for (const r of rows) lines.push([r.rank, r.name, r.address, r.points, r.turnsPicked, r.eligible].map(cell).join(","));
  return lines.join("\r\n");
}
