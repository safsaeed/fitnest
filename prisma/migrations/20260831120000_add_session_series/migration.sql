-- CreateTable
CREATE TABLE "SessionSeries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "repeatPattern" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionSeries_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "SessionSeries_startsOn_idx" ON "SessionSeries"("startsOn");

-- CreateIndex
CREATE INDEX "SessionSeries_endsOn_idx" ON "SessionSeries"("endsOn");

-- CreateIndex
CREATE INDEX "Session_seriesId_idx" ON "Session"("seriesId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "SessionSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
