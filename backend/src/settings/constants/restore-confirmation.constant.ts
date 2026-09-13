/// The exact phrase a caller must echo back to restore a backup — enforced
/// server-side (RestoreBackupDto/BackupService), not just a frontend
/// confirm() dialog, since restore is the one operation in this codebase
/// that overwrites the live database. Frontend mirrors this string exactly
/// in its own restore confirmation modal.
export const RESTORE_CONFIRMATION_PHRASE =
  'I understand this will overwrite the live database';
