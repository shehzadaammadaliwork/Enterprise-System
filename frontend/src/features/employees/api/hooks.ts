import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './employees.api';
import type { EmploymentStatus, LeaveStatus } from './types';

const KEYS = {
  myProfile: ['employees', 'me'] as const,
  employees: ['employees', 'list'] as const,
  employee: (id: string) => ['employees', 'detail', id] as const,
  users: (search?: string, needsOnboarding?: boolean, limit?: number) =>
    ['users', 'list', search ?? null, needsOnboarding ?? null, limit ?? null] as const,
  myAttendance: ['attendance', 'me'] as const,
  employeeAttendance: (id: string) => ['attendance', id] as const,
  myLeave: ['leave-requests', 'me'] as const,
  allLeave: ['leave-requests', 'all'] as const,
  leaveRequest: (id: string) => ['leave-requests', 'detail', id] as const,
  myPayslips: ['payroll', 'me'] as const,
  payrollRuns: ['payroll', 'runs'] as const,
  payrollRun: (id: string) => ['payroll', 'runs', id] as const,
  payrollAdjustments: (month: number, year: number, employeeIds?: string[]) =>
    ['payroll', 'adjustments', month, year, employeeIds ?? null] as const,
  myReviews: ['performance-reviews', 'me'] as const,
  employeeReviews: (id: string) => ['performance-reviews', id] as const,
};

// -- Employee profiles ----------------------------------------------------

export function useMyEmployeeProfile() {
  return useQuery({ queryKey: KEYS.myProfile, queryFn: api.fetchMyEmployeeProfile, retry: false });
}

export function useEmployees(departmentId?: string, status?: EmploymentStatus, limit = 50) {
  return useQuery({
    queryKey: [...KEYS.employees, departmentId ?? null, status ?? null, limit],
    queryFn: () => api.fetchEmployees(1, limit, departmentId, status),
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({ queryKey: KEYS.employee(id ?? ''), queryFn: () => api.fetchEmployee(id!), enabled: !!id });
}

// -- Users (onboarding lookup) --------------------------------------------

export function useUsers(search?: string, needsOnboarding?: boolean, limit = 50) {
  return useQuery({
    queryKey: KEYS.users(search, needsOnboarding, limit),
    queryFn: () => api.fetchUsers(1, limit, search, needsOnboarding),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.employees }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateEmployee>[1] }) => api.updateEmployee(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.employees });
      queryClient.invalidateQueries({ queryKey: KEYS.employee(variables.id) });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deactivateEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.employees }),
  });
}

// -- Attendance -------------------------------------------------------------

export function useMyAttendance() {
  return useQuery({ queryKey: KEYS.myAttendance, queryFn: () => api.fetchMyAttendance() });
}

export function useEmployeeAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: KEYS.employeeAttendance(employeeId ?? ''),
    queryFn: () => api.fetchEmployeeAttendance(employeeId!),
    enabled: !!employeeId,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.checkIn, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.myAttendance }) });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.checkOut, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.myAttendance }) });
}

// -- Leave requests -----------------------------------------------------

export function useMyLeaveRequests() {
  return useQuery({ queryKey: KEYS.myLeave, queryFn: () => api.fetchMyLeaveRequests() });
}

export function useAllLeaveRequests(status?: LeaveStatus) {
  return useQuery({ queryKey: [...KEYS.allLeave, status ?? null], queryFn: () => api.fetchAllLeaveRequests(status) });
}

export function useLeaveRequest(id: string | undefined) {
  return useQuery({ queryKey: KEYS.leaveRequest(id ?? ''), queryFn: () => api.fetchLeaveRequest(id!), enabled: !!id });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.myLeave }),
  });
}

export function useDecideLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.decideLeaveRequest(id, approve),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.allLeave });
      queryClient.invalidateQueries({ queryKey: KEYS.leaveRequest(variables.id) });
    },
  });
}

// -- Payroll --------------------------------------------------------------

export function useMyPayslips() {
  return useQuery({ queryKey: KEYS.myPayslips, queryFn: () => api.fetchMyPayslips() });
}

export function usePayrollRuns() {
  return useQuery({
    queryKey: KEYS.payrollRuns,
    queryFn: () => api.fetchPayrollRuns(),
    // Poll while any run in the list is still queued/processing, so the
    // list reflects the BullMQ job's own completion without requiring a
    // manual navigate-away-and-back to force a remount refetch.
    refetchInterval: (query) =>
      query.state.data?.data.some((run) => run.status === 'PENDING' || run.status === 'PROCESSING') ? 3000 : false,
  });
}

export function usePayrollRun(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.payrollRun(id ?? ''),
    queryFn: () => api.fetchPayrollRun(id!),
    enabled: !!id,
    // Poll while a run is still processing so the UI reflects BullMQ's
    // background completion without a manual refresh.
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' || query.state.data?.status === 'PROCESSING' ? 2000 : false),
  });
}

export function useTriggerPayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.TriggerPayrollRunInput) => api.triggerPayrollRun(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.payrollRuns }),
  });
}

export function usePayrollAdjustments(month: number, year: number, employeeIds: string[] | undefined, enabled = true) {
  return useQuery({
    queryKey: KEYS.payrollAdjustments(month, year, employeeIds),
    queryFn: () => api.fetchPayrollAdjustments(month, year, employeeIds),
    enabled,
  });
}

export function useSavePayrollAdjustments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year, adjustments }: { month: number; year: number; adjustments: api.PayrollAdjustmentInput[] }) =>
      api.savePayrollAdjustments(month, year, adjustments),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'adjustments', variables.month, variables.year] });
    },
  });
}

// -- Performance reviews ----------------------------------------------------

export function useMyPerformanceReviews() {
  return useQuery({ queryKey: KEYS.myReviews, queryFn: () => api.fetchMyPerformanceReviews() });
}

export function useEmployeePerformanceReviews(employeeId: string | undefined) {
  return useQuery({
    queryKey: KEYS.employeeReviews(employeeId ?? ''),
    queryFn: () => api.fetchEmployeePerformanceReviews(employeeId!),
    enabled: !!employeeId,
  });
}

export function useCreatePerformanceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: api.CreatePerformanceReviewInput }) =>
      api.createPerformanceReview(employeeId, input),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: KEYS.employeeReviews(variables.employeeId) }),
  });
}
