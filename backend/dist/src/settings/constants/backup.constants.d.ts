export declare const BACKUP_TYPES: readonly ["DATABASE", "STORAGE", "FULL"];
export type BackupType = (typeof BACKUP_TYPES)[number];
export declare const BACKUP_JOB_STATUSES: readonly ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"];
export type BackupJobStatus = (typeof BACKUP_JOB_STATUSES)[number];
export declare const BACKUP_TRIGGERS: readonly ["MANUAL", "SCHEDULED", "PRE_RESTORE_SAFETY"];
export type BackupTrigger = (typeof BACKUP_TRIGGERS)[number];
