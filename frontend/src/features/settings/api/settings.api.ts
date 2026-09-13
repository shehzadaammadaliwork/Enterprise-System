import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type {
  ApiKeySummary,
  BackupRecord,
  BackupType,
  CreatedApiKey,
  RestoreRecord,
  SystemSettings,
} from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// -- General settings ---------------------------------------------------

export async function fetchSettings() {
  const res = await apiClient.get<Envelope<SystemSettings>>('/settings');
  return res.data.data;
}

export type UpdateSettingsInput = Partial<
  Pick<
    SystemSettings,
    'brandPrimaryColor' | 'timezone' | 'currencyCode' | 'currencyLocale' | 'backupRetentionCount'
  >
> & { backupSchedule?: string | null };

export async function updateSettings(input: UpdateSettingsInput) {
  const res = await apiClient.patch<Envelope<SystemSettings>>('/settings', input);
  return res.data.data;
}

export async function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<Envelope<SystemSettings>>('/settings/branding/logo', formData);
  return res.data.data;
}

export async function deleteLogo() {
  const res = await apiClient.delete<Envelope<SystemSettings>>('/settings/branding/logo');
  return res.data.data;
}

// -- API keys -------------------------------------------------------------

export async function fetchApiKeys() {
  const res = await apiClient.get<Envelope<ApiKeySummary[]>>('/settings/api-keys');
  return res.data.data;
}

export async function createApiKey(input: { label: string; expiresAt?: string }) {
  const res = await apiClient.post<Envelope<CreatedApiKey>>('/settings/api-keys', input);
  return res.data.data;
}

export async function revokeApiKey(id: string) {
  const res = await apiClient.delete<Envelope<ApiKeySummary>>(`/settings/api-keys/${id}`);
  return res.data.data;
}

// -- Backups & restore ------------------------------------------------------

export async function fetchBackups(page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<BackupRecord>>('/settings/backups', {
    params: { page, limit },
  });
  return res.data;
}

export async function runBackup(type: BackupType = 'FULL') {
  const res = await apiClient.post<Envelope<BackupRecord>>('/settings/backups/run', { type });
  return res.data.data;
}

/// Authorization-header-protected like Documents' downloads — fetched as a
/// blob and saved via a throwaway object URL, not a plain <a href>.
export async function downloadBackup(id: string) {
  const res = await apiClient.get<Blob>(`/settings/backups/${id}/download`, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `backup-${id}.dump`;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export async function restoreBackup(id: string, confirmationPhrase: string) {
  const res = await apiClient.post<Envelope<RestoreRecord>>(`/settings/backups/${id}/restore`, {
    confirmationBackupId: id,
    confirmationPhrase,
  });
  return res.data.data;
}

export async function fetchRestore(id: string) {
  const res = await apiClient.get<Envelope<RestoreRecord>>(`/settings/backups/restores/${id}`);
  return res.data.data;
}
