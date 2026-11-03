-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthNonce" (
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("nonce")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "sponsorName" TEXT,
    "sponsorLogoUrl" TEXT,
    "sponsorUrl" TEXT,
    "prizeText" TEXT,
    "bossLevel" INTEGER NOT NULL,
    "maxCrowdMoves" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "result" TEXT,
    "fen" TEXT NOT NULL,
    "crowdMoveNumber" INTEGER NOT NULL DEFAULT 0,
    "emptyTurnStreak" INTEGER NOT NULL DEFAULT 0,
    "isPractice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "claimedAt" TIMESTAMP(3),
    "opensAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "fenBefore" TEXT NOT NULL,
    "candidates" JSONB NOT NULL,
    "chosenUci" TEXT,
    "crowdSan" TEXT,
    "bossReplyUci" TEXT,
    "bossReplySan" TEXT,
    "fenAfter" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Turn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "uci" TEXT NOT NULL,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventScore" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "turnsPicked" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "disqualified" BOOLEAN NOT NULL DEFAULT false,
    "prizePaidAt" TIMESTAMP(3),

    CONSTRAINT "EventScore_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "organization" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_isPractice_createdAt_idx" ON "Event"("isPractice", "createdAt");

-- CreateIndex
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_eventId_number_key" ON "Turn"("eventId", "number");

-- CreateIndex
CREATE INDEX "Pick_userId_idx" ON "Pick"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_eventId_turnNumber_userId_key" ON "Pick"("eventId", "turnNumber", "userId");

-- CreateIndex
CREATE INDEX "EventScore_eventId_points_idx" ON "EventScore"("eventId", "points");

-- CreateIndex
CREATE INDEX "EventScore_userId_idx" ON "EventScore"("userId");

-- AddForeignKey
ALTER TABLE "Turn" ADD CONSTRAINT "Turn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventScore" ADD CONSTRAINT "EventScore_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventScore" ADD CONSTRAINT "EventScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

