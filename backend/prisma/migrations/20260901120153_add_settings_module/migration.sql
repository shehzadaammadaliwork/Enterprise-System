-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('DATABASE', 'STORAGE', 'FULL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'PRE_RESTORE_SAFETY');

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "brandLogoKey" TEXT,
    "brandPrimaryColor" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "currencyLocale" TEXT NOT NULL DEFAULT 'en-US',
    "backupSchedule" TEXT,
    "backupRetentionCount" INTEGER NOT NULL DEFAULT 7,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_records" (
    "id" TEXT NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "trigger" "BackupTrigger" NOT NULL,
    "filePath" TEXT,
    "fileSizeBytes" BIGINT,
    "errorMessage" TEXT,
    "triggeredByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restore_records" (
    "id" TEXT NOT NULL,
    "backupRecordId" TEXT NOT NULL,
    "preRestoreBackupId" TEXT,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredByUserId" TEXT NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "restore_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- AddForeignKey
ALTER TABLE "restore_records" ADD CONSTRAINT "restore_records_backupRecordId_fkey" FOREIGN KEY ("backupRecordId") REFERENCES "backup_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restore_records" ADD CONSTRAINT "restore_records_preRestoreBackupId_fkey" FOREIGN KEY ("preRestoreBackupId") REFERENCES "backup_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
