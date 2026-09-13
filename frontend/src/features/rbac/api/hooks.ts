import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './rbac.api';
import type { PermissionOverrideState } from './types';

const KEYS = {
  roles: ['rbac', 'roles'] as const,
  employeeAccess: (employeeId: string) => ['rbac', 'employees', employeeId, 'access'] as const,
};

export function useRoles() {
  return useQuery({ queryKey: KEYS.roles, queryFn: api.fetchRoles });
}

export function useEmployeeAccess(employeeId: string | undefined) {
  return useQuery({
    queryKey: KEYS.employeeAccess(employeeId ?? ''),
    queryFn: () => api.fetchEmployeeAccess(employeeId!),
    enabled: !!employeeId,
  });
}

export function useSetUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; employeeId: string; roleIds: string[] }) =>
      api.setUserRoles(userId, roleIds),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: KEYS.employeeAccess(variables.employeeId) }),
  });
}

export function useSetEmployeeOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      permissionId,
      state,
    }: {
      employeeId: string;
      permissionId: string;
      state: Extract<PermissionOverrideState, 'GRANTED' | 'DENIED'>;
    }) => api.setEmployeeOverride(employeeId, permissionId, state),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: KEYS.employeeAccess(variables.employeeId) }),
  });
}

export function useResetEmployeeOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, permissionId }: { employeeId: string; permissionId: string }) =>
      api.resetEmployeeOverride(employeeId, permissionId),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: KEYS.employeeAccess(variables.employeeId) }),
  });
}

export function useResetAllEmployeeOverrides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => api.resetAllEmployeeOverrides(employeeId),
    onSuccess: (_data, employeeId) =>
      queryClient.invalidateQueries({ queryKey: KEYS.employeeAccess(employeeId) }),
  });
}
