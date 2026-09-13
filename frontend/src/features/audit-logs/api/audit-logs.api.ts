import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { AuditAction, AuditLogEntry } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userEmail?: string;
  module?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchAuditLogs(filters: AuditLogFilters) {
  const res = await apiClient.get<PaginatedEnvelope<AuditLogEntry>>('/audit-logs', { params: filters });
  return res.data;
}

export async function fetchAuditLogModules() {
  const res = await apiClient.get<Envelope<string[]>>('/audit-logs/modules');
  return res.data.data;
}
