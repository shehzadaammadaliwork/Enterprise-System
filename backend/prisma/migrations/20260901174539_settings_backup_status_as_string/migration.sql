-- Convert backup_records.type/trigger/status and restore_records.status
-- from Postgres enum types to plain text. See the schema comment above
-- BackupRecord: pg_dump still emits CREATE/DROP TYPE for an enum type even
-- when --exclude-table drops the tables that use it, which breaks
-- `pg_restore --clean` against these deliberately excluded, still-live
-- tables (confirmed by hitting exactly this failure in end-to-end restore
-- testing). Existing rows are preserved via an explicit ::TEXT cast.

ALTER TABLE "backup_records" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "backup_records" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;
ALTER TABLE "backup_records" ALTER COLUMN "trigger" TYPE TEXT USING "trigger"::TEXT;
ALTER TABLE "backup_records" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "backup_records" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "restore_records" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "restore_records" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "restore_records" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "BackupType";
DROP TYPE "BackupTrigger";
DROP TYPE "BackupStatus";
