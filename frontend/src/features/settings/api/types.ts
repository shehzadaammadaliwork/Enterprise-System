export interface SystemSettings {
  id: string;
  brandLogoKey: string | null;
  brandPrimaryColor: string | null;
  timezone: string;
  currencyCode: string;
  currencyLocale: string;
  backupSchedule: string | null;
  backupRetentionCount: number;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeySummary {
  id: string;
  label: string;
  keyPrefix: string;
  createdByUserId: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

/// Only the create-key response ever carries this — shown to the user
/// exactly once, then gone for good (only the hash is stored server-side).
export interface CreatedApiKey extends ApiKeySummary {
  plaintextKey: string;
}

export type BackupType = 'DATABASE' | 'STORAGE' | 'FULL';
export type BackupJobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export type BackupTrigger = 'MANUAL' | 'SCHEDULED' | 'PRE_RESTORE_SAFETY';

export interface BackupRecord {
  id: string;
  type: BackupType;
  status: BackupJobStatus;
  trigger: BackupTrigger;
  filePath: string | null;
  fileSizeBytes: string | null;
  errorMessage: string | null;
  triggeredByUserId: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface RestoreRecord {
  id: string;
  backupRecordId: string;
  preRestoreBackupId: string | null;
  status: BackupJobStatus;
  triggeredByUserId: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}
