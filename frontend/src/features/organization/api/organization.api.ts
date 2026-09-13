import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { Branch, CompanyHoliday, CompanyProfile, Department, DepartmentTreeNode } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// -- Company profile --------------------------------------------------

export async function fetchCompanyProfile() {
  const res = await apiClient.get<Envelope<CompanyProfile>>('/organization/company');
  return res.data.data;
}

export async function updateCompanyProfile(input: Partial<Pick<CompanyProfile, 'name' | 'fiscalYearStartMonth' | 'workingHoursStart' | 'workingHoursEnd'>>) {
  const res = await apiClient.patch<Envelope<CompanyProfile>>('/organization/company', input);
  return res.data.data;
}

// -- Branches -----------------------------------------------------------

export async function fetchBranches(page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<Branch>>('/organization/branches', { params: { page, limit } });
  return res.data;
}

export type BranchInput = Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>;

export async function createBranch(input: Partial<BranchInput> & { name: string }) {
  const res = await apiClient.post<Envelope<Branch>>('/organization/branches', input);
  return res.data.data;
}

export async function updateBranch(id: string, input: Partial<BranchInput>) {
  const res = await apiClient.patch<Envelope<Branch>>(`/organization/branches/${id}`, input);
  return res.data.data;
}

export async function deleteBranch(id: string) {
  await apiClient.delete(`/organization/branches/${id}`);
}

// -- Departments ----------------------------------------------------------

export async function fetchDepartments(branchId?: string, page = 1, limit = 100) {
  const res = await apiClient.get<PaginatedEnvelope<Department>>('/organization/departments', {
    params: { page, limit, branchId },
  });
  return res.data;
}

export async function fetchDepartmentTree() {
  const res = await apiClient.get<Envelope<DepartmentTreeNode[]>>('/organization/departments/tree');
  return res.data.data;
}

export interface DepartmentInput {
  name: string;
  code?: string;
  branchId?: string | null;
  parentId?: string | null;
  managerUserId?: string | null;
}

export async function createDepartment(input: DepartmentInput) {
  const res = await apiClient.post<Envelope<Department>>('/organization/departments', input);
  return res.data.data;
}

export async function updateDepartment(id: string, input: Partial<DepartmentInput>) {
  const res = await apiClient.patch<Envelope<Department>>(`/organization/departments/${id}`, input);
  return res.data.data;
}

export async function deleteDepartment(id: string) {
  await apiClient.delete(`/organization/departments/${id}`);
}

// -- Company holidays -----------------------------------------------------

export async function fetchHolidays(page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<CompanyHoliday>>('/organization/holidays', { params: { page, limit } });
  return res.data;
}

export interface HolidayInput {
  name: string;
  date: string;
  description?: string;
  recurringAnnually?: boolean;
}

export async function createHoliday(input: HolidayInput) {
  const res = await apiClient.post<Envelope<CompanyHoliday>>('/organization/holidays', input);
  return res.data.data;
}

export async function updateHoliday(id: string, input: Partial<HolidayInput>) {
  const res = await apiClient.patch<Envelope<CompanyHoliday>>(`/organization/holidays/${id}`, input);
  return res.data.data;
}

export async function deleteHoliday(id: string) {
  await apiClient.delete(`/organization/holidays/${id}`);
}
