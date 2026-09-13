import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { EmployeeAccess, PermissionOverrideState, Role } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export async function fetchRoles() {
  const res = await apiClient.get<PaginatedEnvelope<Role>>('/rbac/roles', { params: { limit: 100 } });
  return res.data;
}

export async function fetchEmployeeAccess(employeeId: string) {
  const res = await apiClient.get<Envelope<EmployeeAccess>>(`/rbac/employees/${employeeId}/access`);
  return res.data.data;
}

export async function setUserRoles(userId: string, roleIds: string[]) {
  await apiClient.put(`/rbac/users/${userId}/roles`, { roleIds });
}

export async function setEmployeeOverride(
  employeeId: string,
  permissionId: string,
  state: Extract<PermissionOverrideState, 'GRANTED' | 'DENIED'>,
) {
  const res = await apiClient.put<Envelope<EmployeeAccess>>(
    `/rbac/employees/${employeeId}/overrides/${permissionId}`,
    { state },
  );
  return res.data.data;
}

export async function resetEmployeeOverride(employeeId: string, permissionId: string) {
  const res = await apiClient.delete<Envelope<EmployeeAccess>>(
    `/rbac/employees/${employeeId}/overrides/${permissionId}`,
  );
  return res.data.data;
}

export async function resetAllEmployeeOverrides(employeeId: string) {
  const res = await apiClient.post<Envelope<EmployeeAccess>>(
    `/rbac/employees/${employeeId}/overrides/reset-all`,
  );
  return res.data.data;
}
