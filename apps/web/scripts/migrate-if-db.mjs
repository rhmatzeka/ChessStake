import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!process.env.DATABASE_URL) {
  console.log("migrate-if-db: DATABASE_URL not set, skipping prisma migrate deploy");
  process.exit(0);
}
if (!process.env.DIRECT_URL) {
  console.error(
    "migrate-if-db: DATABASE_URL is set but DIRECT_URL is missing. Set DIRECT_URL to the non-pooled Neon connection string, because migrations cannot run through the pooler.",
  );
  process.exit(1);
}
if (!existsSync(path.join(root, "prisma", "migrations"))) {
  console.log("migrate-if-db: prisma/migrations not found, skipping prisma migrate deploy");
  process.exit(0);
}
const res = spawnSync("node", ["scripts/bin.mjs", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
  cwd: root,
  stdio: "inherit",
});
process.exit(res.status ?? 1);
