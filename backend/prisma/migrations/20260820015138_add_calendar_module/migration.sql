-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'DEADLINE', 'LEAVE', 'HOLIDAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationEventType" ADD VALUE 'CALENDAR_EVENT_INVITED';
ALTER TYPE "NotificationEventType" ADD VALUE 'CALENDAR_EVENT_REMINDER';

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "departmentId" TEXT,
    "reminderMinutesBefore" INTEGER,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "calendar_event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_startAt_idx" ON "calendar_events"("startAt");

-- CreateIndex
CREATE INDEX "calendar_events_departmentId_idx" ON "calendar_events"("departmentId");

-- CreateIndex
CREATE INDEX "calendar_event_attendees_eventId_idx" ON "calendar_event_attendees"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_attendees_eventId_userId_key" ON "calendar_event_attendees"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "calendar_event_attendees" ADD CONSTRAINT "calendar_event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
