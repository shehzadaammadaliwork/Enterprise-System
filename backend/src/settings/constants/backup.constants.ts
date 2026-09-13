/// Application-level equivalents of what would otherwise be Postgres enum
/// types — deliberately plain strings on BackupRecord/RestoreRecord instead
/// (see the schema comment above BackupRecord for why: a Postgres enum type
/// used only by these two tables still gets DROP/CREATE TYPE statements
/// emitted into every pg_dump regardless of --exclude-table, which breaks
/// `pg_restore --clean` against the live, deliberately-untouched tables).
export const BACKUP_TYPES = ['DATABASE', 'STORAGE', 'FULL'] as const;
export type BackupType = (typeof BACKUP_TYPES)[number];

export const BACKUP_JOB_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
] as const;
export type BackupJobStatus = (typeof BACKUP_JOB_STATUSES)[number];

export const BACKUP_TRIGGERS = [
  'MANUAL',
  'SCHEDULED',
  'PRE_RESTORE_SAFETY',
] as const;
export type BackupTrigger = (typeof BACKUP_TRIGGERS)[number];
