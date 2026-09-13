import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { PurchaseRequest, PurchaseRequestCategory, PurchaseRequestStatus } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface PurchaseRequestFilters {
  status?: PurchaseRequestStatus;
  category?: PurchaseRequestCategory;
}

export async function fetchPurchaseRequests(filters: PurchaseRequestFilters = {}, page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<PurchaseRequest>>('/purchase-requests', {
    params: { ...filters, page, limit },
  });
  return res.data;
}

export async function fetchMyPurchaseRequests(page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<PurchaseRequest>>('/purchase-requests/me', {
    params: { page, limit },
  });
  return res.data;
}

export async function fetchPurchaseRequest(id: string) {
  const res = await apiClient.get<Envelope<PurchaseRequest>>(`/purchase-requests/${id}`);
  return res.data.data;
}

export interface PurchaseRequestInput {
  description: string;
  category: PurchaseRequestCategory;
  estimatedCost: number;
  reason: string;
}

export async function createPurchaseRequest(input: PurchaseRequestInput) {
  const res = await apiClient.post<Envelope<PurchaseRequest>>('/purchase-requests', input);
  return res.data.data;
}

export async function decidePurchaseRequest(id: string, approve: boolean) {
  const res = await apiClient.patch<Envelope<PurchaseRequest>>(`/purchase-requests/${id}/${approve ? 'approve' : 'reject'}`);
  return res.data.data;
}

export interface MarkPurchasedInput {
  actualAmount: number;
  bankAccountId: string;
}

export async function markPurchased(id: string, input: MarkPurchasedInput) {
  const res = await apiClient.patch<Envelope<PurchaseRequest>>(`/purchase-requests/${id}/mark-purchased`, input);
  return res.data.data;
}
