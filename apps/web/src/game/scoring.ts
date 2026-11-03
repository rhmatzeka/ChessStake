import type { EventResult } from "./types";

const MIN_TURNS_FOR_BONUS = 5;
const MIN_TURNS_FOR_PRIZE = 10;

/** Points for one pick: 110 for a perfect move, minus 1 per 3 cp lost, floor 10. */
export function pickPoints(cpLoss: number): number {
  return Math.max(10, Math.round(110 - cpLoss / 3));
}

/** End-of-event bonus; needs at least 5 turns picked. */
export function eventBonus(result: EventResult, turnsPicked: number): number {
  if (turnsPicked < MIN_TURNS_FOR_BONUS) return 0;
  if (result === "WIN") return 500;
  if (result === "SURVIVED") return 200;
  return 0;
}

/** Prize pool eligibility: at least 10 turns picked and not disqualified. */
export function isPrizeEligible(turnsPicked: number, disqualified: boolean): boolean {
  return !disqualified && turnsPicked >= MIN_TURNS_FOR_PRIZE;
}
