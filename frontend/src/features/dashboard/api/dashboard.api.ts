import { apiClient } from '../../../shared/api/client';
import type { DashboardSummary } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

export async function fetchDashboardSummary() {
  const res = await apiClient.get<Envelope<DashboardSummary>>('/dashboard/summary');
  return res.data.data;
}
