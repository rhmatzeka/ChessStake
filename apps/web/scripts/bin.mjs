// Runs a dependency binary whether pnpm linked it in apps/web or hoisted it to the repo root.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [name, ...args] = process.argv.slice(2);
const dirs = [path.join(root, "node_modules", ".bin"), path.join(root, "..", "..", "node_modules", ".bin")];
const dir = dirs.find((d) => existsSync(path.join(d, name)));
if (!dir) {
  console.error(`bin.mjs: cannot find "${name}" in ${dirs.join(" or ")}`);
  process.exit(1);
}
const res = spawnSync(path.join(dir, name), args, { cwd: root, stdio: "inherit" });
process.exit(res.status ?? 1);
