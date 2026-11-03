import { Chess } from "chess.js";
import { labelMove } from "./labels";
import type { Candidate, EngineLine, Quality } from "./types";

/** best < 30 cp loss, okay 30-149, blunder >= 150. */
export function qualityOf(cpLoss: number): Quality {
  if (cpLoss < 30) return "best";
  if (cpLoss < 150) return "okay";
  return "blunder";
}

function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Scored = { line: EngineLine; loss: number; rank: number; tempting: boolean };

/** Pick best + an okay + a trap from analysed lines, shuffled deterministically by seed. */
export function selectCandidates(fen: string, lines: EngineLine[], seed: string): Candidate[] {
  const board = new Chess(fen);
  const legal = new Map(
    board.moves({ verbose: true }).map((m) => [m.from + m.to + (m.promotion ?? ""), m]),
  );
  const seen = new Set<string>();
  const valid = lines
    .filter((l) => legal.has(l.uci) && !seen.has(l.uci) && !!seen.add(l.uci))
    .sort((a, b) => b.cp - a.cp);
  if (valid.length === 0) return [];

  const bestCp = valid[0]!.cp;
  const scored: Scored[] = valid.map((line, rank) => {
    const m = legal.get(line.uci)!;
    return {
      line,
      loss: Math.max(0, bestCp - line.cp),
      rank,
      tempting: !!m.captured || m.san.includes("+") || m.san.includes("#"),
    };
  });

  const picked: Scored[] = [scored[0]!];
  let rest = scored.slice(1);
  const take = (s: Scored | undefined) => {
    if (!s) return;
    picked.push(s);
    rest = rest.filter((r) => r !== s);
  };

  // Okay: 40-149 loss, engine rank 3-6 (index 2-5) preferred.
  const okayBand = rest.filter((s) => s.loss >= 40 && s.loss < 150);
  const okay =
    okayBand.find((s) => s.rank >= 2 && s.rank <= 5) ??
    okayBand[0] ??
    rest.find((s) => s.loss >= 30 && s.loss < 150) ??
    // Nothing in the band: next weakest line that is still short of a blunder, else the mildest remaining.
    [...rest].sort((a, b) => b.loss - a.loss).find((s) => s.loss < 150) ??
    rest[0];
  take(okay);

  // Trap: >= 150 loss, tempting first; else the weakest remaining line.
  const traps = rest.filter((s) => s.loss >= 150);
  const trap =
    traps.filter((s) => s.tempting).sort((a, b) => b.loss - a.loss)[0] ??
    [...traps].sort((a, b) => b.loss - a.loss)[0] ??
    [...rest].sort((a, b) => b.loss - a.loss)[0];
  take(trap);

  const out: Candidate[] = picked.map((s) => ({
    uci: s.line.uci,
    san: legal.get(s.line.uci)!.san,
    label: labelMove(fen, s.line.uci),
    evalCp: s.line.cp,
    cpLoss: s.loss,
    quality: qualityOf(s.loss),
  }));

  const rnd = mulberry32(hashSeed(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
