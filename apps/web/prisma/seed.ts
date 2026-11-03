// Usage: pnpm --filter web db:seed (needs DATABASE_URL). Creates practice-1 if no practice event exists.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.event.findFirst({ where: { isPractice: true } });
  if (existing) {
    console.log(`seed: practice event ${existing.slug} already exists`);
    return;
  }
  await prisma.event.upsert({
    where: { slug: "practice-1" },
    update: {},
    create: {
      slug: "practice-1",
      title: "Practice Arena",
      hostName: "PawnPool",
      bossLevel: 2,
      maxCrowdMoves: 30,
      startsAt: new Date(),
      status: "LIVE",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      isPractice: true,
    },
  });
  console.log("seed: created practice-1 (its first turn opens on the first read)");
}

main().finally(() => prisma.$disconnect());
