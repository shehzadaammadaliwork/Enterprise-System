import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { Asset, AssetCategory, AssetStatus } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface AssetFilters {
  status?: AssetStatus;
  category?: AssetCategory;
  search?: string;
}

export async function fetchAssets(filters: AssetFilters = {}, page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<Asset>>('/assets', {
    params: { ...filters, page, limit },
  });
  return res.data;
}

export async function fetchAsset(id: string) {
  const res = await apiClient.get<Envelope<Asset>>(`/assets/${id}`);
  return res.data.data;
}

export interface AssetInput {
  name: string;
  category: AssetCategory;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
}

export async function createAsset(input: AssetInput) {
  const res = await apiClient.post<Envelope<Asset>>('/assets', input);
  return res.data.data;
}

export async function updateAsset(id: string, input: Partial<AssetInput>) {
  const res = await apiClient.patch<Envelope<Asset>>(`/assets/${id}`, input);
  return res.data.data;
}

export async function deleteAsset(id: string) {
  await apiClient.delete(`/assets/${id}`);
}

export interface ChangeAssetStatusInput {
  status: AssetStatus;
  assignedEmployeeId?: string;
  retirementReason?: string;
}

export async function changeAssetStatus(id: string, input: ChangeAssetStatusInput) {
  const res = await apiClient.patch<Envelope<Asset>>(`/assets/${id}/status`, input);
  return res.data.data;
}
