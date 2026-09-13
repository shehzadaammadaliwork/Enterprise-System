import { useQuery } from '@tanstack/react-query';
import * as api from './reports.api';
import type { DateRangeFilters, SalesPerformanceFilters } from './reports.api';

const KEYS = {
  salesPerformance: ['reports', 'sales-performance'] as const,
  hr: ['reports', 'hr'] as const,
  finance: ['reports', 'finance'] as const,
};

export function useSalesPerformanceReport(filters: SalesPerformanceFilters | undefined) {
  return useQuery({
    queryKey: [...KEYS.salesPerformance, filters],
    queryFn: () => api.fetchSalesPerformanceReport(filters!),
    enabled: !!filters,
  });
}

export function useHrReport(filters: DateRangeFilters | undefined) {
  return useQuery({
    queryKey: [...KEYS.hr, filters],
    queryFn: () => api.fetchHrReport(filters!),
    enabled: !!filters,
  });
}

export function useFinanceOverviewReport(filters: DateRangeFilters | undefined) {
  return useQuery({
    queryKey: [...KEYS.finance, filters],
    queryFn: () => api.fetchFinanceOverviewReport(filters!),
    enabled: !!filters,
  });
}
