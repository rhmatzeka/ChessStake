import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { Chess } from "chess.js";
import { analyseFallback, bossMoveFallback } from "./engine-fallback";
import type { BossLevel, EngineLine } from "./types";

// Stockfish 19 lite single-threaded WASM, vendored in apps/web/vendor/stockfish (see its README).
// Loaded once per process; one search at a time; any failure or timeout falls back to engine-fallback.

export const BOSS_LEVELS: Record<BossLevel, { skill: number; depth: number }> = {
  1: { skill: 0, depth: 1 },
  2: { skill: 4, depth: 2 },
  3: { skill: 9, depth: 4 },
  4: { skill: 14, depth: 7 },
  5: { skill: 20, depth: 12 },
};

const CLAMP = 1000;
const TIMEOUT_MARGIN_MS = 1500;
const BOSS_MOVETIME_MS = 1500;
const LOAD_TIMEOUT_MS = 5000;
const ENGINE_FILE = "stockfish-19-lite-single.js";

/** Counters so callers (bench, tests) can tell which engine answered. */
export const engineStats = { stockfish: 0, fallback: 0 };

type SfEngine = {
  listener: ((line: string) => void) | null;
  processCommand: (cmd: string) => void;
  terminate?: () => void;
};

let enginePromise: Promise<SfEngine> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function findEngineFile(): string {
  const roots = [process.cwd(), path.join(process.cwd(), "apps/web")];
  for (const root of roots) {
    const p = path.join(root, "vendor", "stockfish", ENGINE_FILE);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`stockfish engine file not found under ${roots.join(" or ")}`);
}

function waitFor(engine: SfEngine, cmd: string, done: RegExp, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      engine.listener = null;
      reject(new Error(`engine did not answer "${cmd}"`));
    }, ms);
    engine.listener = (line) => {
      if (done.test(line)) {
        clearTimeout(timer);
        engine.listener = null;
        resolve();
      }
    };
    engine.processCommand(cmd);
  });
}

function loadEngine(): Promise<SfEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const file = findEngineFile();
      const factory = createRequire(file)(file) as () => SfEngine;
      const engine = factory();
      await waitFor(engine, "uci", /^uciok/, LOAD_TIMEOUT_MS);
      await waitFor(engine, "isready", /^readyok/, LOAD_TIMEOUT_MS);
      return engine;
    })();
    enginePromise.catch(() => {
      enginePromise = null; // retry on the next call
    });
  }
  return enginePromise;
}

function dropEngine(engine?: SfEngine) {
  enginePromise = null;
  try {
    engine?.terminate?.();
  } catch {
    /* ignore */
  }
}

/** Run one search; resolves with the info lines and the bestmove line. */
async function runSearch(
  fen: string,
  options: Record<string, string | number>,
  go: string,
  timeoutMs: number,
): Promise<string[]> {
  const engine = await loadEngine();
  const lines: string[] = [];
  return new Promise<string[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      engine.listener = null;
      try {
        engine.processCommand("stop");
      } catch {
        /* ignore */
      }
      dropEngine(engine); // the engine may be wedged; reload next time
      reject(new Error("engine timeout"));
    }, timeoutMs);
    engine.listener = (line) => {
      lines.push(line);
      if (line.startsWith("bestmove")) {
        clearTimeout(timer);
        engine.listener = null;
        resolve(lines);
      }
    };
    for (const [k, v] of Object.entries(options)) engine.processCommand(`setoption name ${k} value ${v}`);
    engine.processCommand("ucinewgame");
    engine.processCommand(`position fen ${fen}`);
    engine.processCommand(go);
  });
}

/** Serialise engine work: one search at a time. */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

const INFO = /^info .*?\bdepth (\d+) .*?\bmultipv (\d+) .*?\bscore (cp|mate) (-?\d+)( lowerbound| upperbound)? .*?\bpv (\S+)/;

function parseAnalysis(out: string[], wanted: number): EngineLine[] {
  const byDepth = new Map<number, Map<number, EngineLine>>();
  for (const line of out) {
    const m = INFO.exec(line);
    if (!m || m[5]) continue; // skip bound-only scores
    const depth = Number(m[1]);
    const n = Number(m[2]);
    const raw = Number(m[4]);
    const cp = m[3] === "mate" ? (raw > 0 ? CLAMP : -CLAMP) : Math.max(-CLAMP, Math.min(CLAMP, raw));
    if (!byDepth.has(depth)) byDepth.set(depth, new Map());
    byDepth.get(depth)!.set(n, { uci: m[6], cp });
  }
  const depths = [...byDepth.keys()].sort((a, b) => b - a);
  for (const d of depths) {
    const pvs = byDepth.get(d)!;
    if (pvs.size >= wanted) {
      return [...pvs.entries()]
        .sort((a, b) => a[0] - b[0])
        .slice(0, wanted)
        .map(([, l]) => l)
        .sort((a, b) => b.cp - a.cp);
    }
  }
  throw new Error("incomplete analysis");
}

function legalCount(fen: string): number {
  return new Chess(fen).moves().length;
}

export async function analyse(
  fen: string,
  opts: { lines: number; budgetMs: number },
): Promise<EngineLine[]> {
  const legal = legalCount(fen);
  const n = Math.min(opts.lines, legal);
  if (n <= 0) return [];
  try {
    const out = await enqueue(() =>
      runSearch(
        fen,
        { "Skill Level": 20, MultiPV: n },
        `go movetime ${opts.budgetMs}`,
        opts.budgetMs + TIMEOUT_MARGIN_MS,
      ),
    );
    const res = parseAnalysis(out, n);
    engineStats.stockfish++;
    return res;
  } catch {
    engineStats.fallback++;
    return analyseFallback(fen, { lines: n, budgetMs: opts.budgetMs });
  }
}

export async function bossMove(fen: string, level: BossLevel): Promise<string> {
  if (legalCount(fen) === 0) throw new Error("no legal moves");
  const { skill, depth } = BOSS_LEVELS[level];
  try {
    const out = await enqueue(() =>
      runSearch(
        fen,
        { "Skill Level": skill, MultiPV: 1 },
        `go depth ${depth} movetime ${BOSS_MOVETIME_MS}`,
        BOSS_MOVETIME_MS + TIMEOUT_MARGIN_MS,
      ),
    );
    const best = /^bestmove (\S+)/.exec(out[out.length - 1])?.[1];
    if (!best || best === "(none)") throw new Error("no bestmove");
    engineStats.stockfish++;
    return best;
  } catch {
    engineStats.fallback++;
    return bossMoveFallback(fen, level);
  }
}
