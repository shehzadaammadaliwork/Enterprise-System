/// Mirrors backend/src/settings/constants/restore-confirmation.constant.ts
/// exactly — the backend is the real enforcement point (BackupService
/// rejects a mismatch regardless of what the frontend sends), this just
/// drives the same copy in the confirmation modal so the two never say
/// different things.
export const RESTORE_CONFIRMATION_PHRASE = 'I understand this will overwrite the live database';
