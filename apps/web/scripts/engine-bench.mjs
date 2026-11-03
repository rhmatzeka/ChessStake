// Usage: node scripts/bin.mjs vite-node scripts/engine-bench.mjs
// Times analyse(lines 8, 900 ms) + bossMove(level 3) on 3 positions, 5 runs each.
import { analyse, bossMove, engineStats } from "../src/game/engine";

const FENS = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
];
const totals = [];
for (const fen of FENS) {
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    await analyse(fen, { lines: 8, budgetMs: 900 });
    await bossMove(fen, 3);
    totals.push(performance.now() - t);
  }
}
totals.sort((a, b) => a - b);
const p95 = totals[Math.ceil(totals.length * 0.95) - 1];
console.log("runs", totals.length, "min", totals[0].toFixed(0), "median", totals[7].toFixed(0), "p95", p95.toFixed(0), "max", totals.at(-1).toFixed(0), "ms");
console.log("engine used", engineStats);
process.exit(0);
