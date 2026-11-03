import { execFileSync } from "node:child_process";
import path from "node:path";
import { prisma } from "@/server/prisma";

const root = path.resolve(__dirname, "..", "..");

/** Drops and recreates the public schema, then applies all migrations. Call once per test file. */
export async function resetDatabase(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  await prisma.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
  await prisma.$executeRawUnsafe("CREATE SCHEMA public");
  execFileSync("node", ["scripts/bin.mjs", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    stdio: "pipe",
  });
}

/** Empties every table; call between tests. */
export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Pick", "EventScore", "Turn", "Event", "User", "AuthNonce", "Lead" RESTART IDENTITY CASCADE',
  );
}
