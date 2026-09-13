import { useQuery } from '@tanstack/react-query';
import * as api from './audit-logs.api';
import type { AuditLogFilters } from './audit-logs.api';

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters] as const,
    queryFn: () => api.fetchAuditLogs(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useAuditLogModules() {
  return useQuery({ queryKey: ['audit-logs', 'modules'] as const, queryFn: api.fetchAuditLogModules });
}
