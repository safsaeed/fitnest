/*
  Warnings:

  - Added the required column `unitPricePence` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Made the column `bookingAccessToken` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'UNPAID');

-- CreateEnum
CREATE TYPE "BookingPricingType" AS ENUM ('STANDARD', 'MEMBER');

-- DropForeignKey
ALTER TABLE "Child" DROP CONSTRAINT "Child_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "parentUserId" TEXT,
ADD COLUMN     "pricingType" "BookingPricingType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "unitPricePence" INTEGER NOT NULL,
ALTER COLUMN "bookingAccessToken" SET NOT NULL;

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "parentChildId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "memberPricePence" INTEGER;

-- CreateTable
CREATE TABLE "ParentUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "defaultEmergencyContactName" TEXT,
    "defaultEmergencyContactPhone" TEXT,
    "stripeCustomerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "allergies" TEXT,
    "medicalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentUser_email_key" ON "ParentUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ParentUser_stripeCustomerId_key" ON "ParentUser"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "ParentUser_email_idx" ON "ParentUser"("email");

-- CreateIndex
CREATE INDEX "ParentUser_isActive_idx" ON "ParentUser"("isActive");

-- CreateIndex
CREATE INDEX "ParentChild_parentUserId_idx" ON "ParentChild"("parentUserId");

-- CreateIndex
CREATE INDEX "ParentChild_isActive_idx" ON "ParentChild"("isActive");

-- CreateIndex
CREATE INDEX "ParentChild_dateOfBirth_idx" ON "ParentChild"("dateOfBirth");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_parentUserId_key" ON "Membership"("parentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_stripeSubscriptionId_key" ON "Membership"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE INDEX "Membership_currentPeriodEnd_idx" ON "Membership"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Booking_parentUserId_idx" ON "Booking"("parentUserId");

-- CreateIndex
CREATE INDEX "Booking_pricingType_idx" ON "Booking"("pricingType");

-- CreateIndex
CREATE INDEX "Child_parentChildId_idx" ON "Child"("parentChildId");

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "ParentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "ParentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "ParentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentChildId_fkey" FOREIGN KEY ("parentChildId") REFERENCES "ParentChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
