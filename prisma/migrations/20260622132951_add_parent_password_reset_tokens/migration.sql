-- CreateTable
CREATE TABLE "ParentPasswordResetToken" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentPasswordResetToken_tokenHash_key" ON "ParentPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ParentPasswordResetToken_parentUserId_idx" ON "ParentPasswordResetToken"("parentUserId");

-- CreateIndex
CREATE INDEX "ParentPasswordResetToken_expiresAt_idx" ON "ParentPasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ParentPasswordResetToken_usedAt_idx" ON "ParentPasswordResetToken"("usedAt");

-- AddForeignKey
ALTER TABLE "ParentPasswordResetToken" ADD CONSTRAINT "ParentPasswordResetToken_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "ParentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
