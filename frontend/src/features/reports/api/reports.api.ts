import { apiClient } from '../../../shared/api/client';
import type {
  FinanceOverviewReport,
  HrReport,
  ReportExportFormat,
  SalesPerformanceReport,
} from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

export interface DateRangeFilters {
  dateFrom: string;
  dateTo: string;
}

export interface SalesPerformanceFilters extends DateRangeFilters {
  assignedToUserId?: string;
}

export async function fetchSalesPerformanceReport(filters: SalesPerformanceFilters) {
  const res = await apiClient.get<Envelope<SalesPerformanceReport>>('/reports/sales-performance', {
    params: filters,
  });
  return res.data.data;
}

export async function fetchHrReport(filters: DateRangeFilters) {
  const res = await apiClient.get<Envelope<HrReport>>('/reports/hr', { params: filters });
  return res.data.data;
}

export async function fetchFinanceOverviewReport(filters: DateRangeFilters) {
  const res = await apiClient.get<Envelope<FinanceOverviewReport>>('/reports/finance', { params: filters });
  return res.data.data;
}

/// Downloads go through apiClient (not a plain <a href>), same reasoning as
/// documents.api.ts's downloadDocumentVersion — the route is
/// Authorization-header-protected, so it has to be fetched as a blob and
/// then handed to the browser via a throwaway object URL.
async function downloadReport(
  path: string,
  filters: DateRangeFilters | SalesPerformanceFilters,
  format: ReportExportFormat,
  fileName: string,
) {
  const res = await apiClient.get<Blob>(path, {
    params: { ...filters, format },
    responseType: 'blob',
  });
  const blobUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${fileName}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export function exportSalesPerformanceReport(
  filters: SalesPerformanceFilters,
  format: ReportExportFormat,
) {
  return downloadReport('/reports/sales-performance/export', filters, format, 'sales-performance-report');
}

export function exportHrReport(filters: DateRangeFilters, format: ReportExportFormat) {
  return downloadReport('/reports/hr/export', filters, format, 'hr-report');
}

export function exportFinanceOverviewReport(filters: DateRangeFilters, format: ReportExportFormat) {
  return downloadReport('/reports/finance/export', filters, format, 'finance-report');
}
