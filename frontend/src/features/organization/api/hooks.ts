import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './organization.api';

const KEYS = {
  company: ['organization', 'company'] as const,
  branches: ['organization', 'branches'] as const,
  departments: ['organization', 'departments'] as const,
  departmentTree: ['organization', 'departments', 'tree'] as const,
  holidays: ['organization', 'holidays'] as const,
};

// -- Company profile --------------------------------------------------

export function useCompanyProfile() {
  return useQuery({ queryKey: KEYS.company, queryFn: api.fetchCompanyProfile });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateCompanyProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.company }),
  });
}

// -- Branches -----------------------------------------------------------

export function useBranches() {
  return useQuery({ queryKey: KEYS.branches, queryFn: () => api.fetchBranches() });
}

function useInvalidateBranches() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: KEYS.branches });
    queryClient.invalidateQueries({ queryKey: KEYS.departments });
    queryClient.invalidateQueries({ queryKey: KEYS.departmentTree });
  };
}

export function useCreateBranch() {
  const invalidate = useInvalidateBranches();
  return useMutation({ mutationFn: api.createBranch, onSuccess: invalidate });
}

export function useUpdateBranch() {
  const invalidate = useInvalidateBranches();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.BranchInput> }) => api.updateBranch(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteBranch() {
  const invalidate = useInvalidateBranches();
  return useMutation({ mutationFn: api.deleteBranch, onSuccess: invalidate });
}

// -- Departments ----------------------------------------------------------

export function useDepartmentTree() {
  return useQuery({ queryKey: KEYS.departmentTree, queryFn: api.fetchDepartmentTree });
}

function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: KEYS.departments });
    queryClient.invalidateQueries({ queryKey: KEYS.departmentTree });
  };
}

export function useCreateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({ mutationFn: api.createDepartment, onSuccess: invalidate });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.DepartmentInput> }) => api.updateDepartment(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({ mutationFn: api.deleteDepartment, onSuccess: invalidate });
}

// -- Company holidays -----------------------------------------------------

export function useHolidays() {
  return useQuery({ queryKey: KEYS.holidays, queryFn: () => api.fetchHolidays() });
}

function useInvalidateHolidays() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.holidays });
}

export function useCreateHoliday() {
  const invalidate = useInvalidateHolidays();
  return useMutation({ mutationFn: api.createHoliday, onSuccess: invalidate });
}

export function useUpdateHoliday() {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.HolidayInput> }) => api.updateHoliday(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHoliday() {
  const invalidate = useInvalidateHolidays();
  return useMutation({ mutationFn: api.deleteHoliday, onSuccess: invalidate });
}
