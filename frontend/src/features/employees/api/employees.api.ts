import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type {
  AttendanceRecord,
  Employee,
  EmploymentStatus,
  LeaveRequest,
  LeaveStatus,
  PayrollAdjustmentsResponse,
  PayrollRun,
  PayrollRunDetail,
  PayrollRunScope,
  PayslipItem,
  PerformanceReview,
  TriggerPayrollRunResult,
  UserListItem,
} from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// -- Employee profiles ----------------------------------------------------

export async function fetchMyEmployeeProfile() {
  const res = await apiClient.get<Envelope<Employee>>('/employees/me');
  return res.data.data;
}

export async function fetchEmployees(page = 1, limit = 50, departmentId?: string, status?: EmploymentStatus) {
  const res = await apiClient.get<PaginatedEnvelope<Employee>>('/employees', { params: { page, limit, departmentId, status } });
  return res.data;
}

export async function fetchEmployee(id: string) {
  const res = await apiClient.get<Envelope<Employee>>(`/employees/${id}`);
  return res.data.data;
}

// -- Users (onboarding lookup) --------------------------------------------

export async function fetchUsers(page = 1, limit = 50, search?: string, needsOnboarding?: boolean) {
  const res = await apiClient.get<PaginatedEnvelope<UserListItem>>('/users', {
    params: {
      page,
      limit,
      search: search || undefined,
      needsOnboarding: needsOnboarding === undefined ? undefined : String(needsOnboarding),
    },
  });
  return res.data;
}

export interface CreateEmployeeInput {
  userId: string;
  roleIds: string[];
  departmentId?: string;
  designation: string;
  joiningDate: string;
  reportingManagerId?: string;
  salary: number;
  city?: string;
  country?: string;
  emergencyContactName?: string;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const res = await apiClient.post<Envelope<Employee>>('/employees', input);
  return res.data.data;
}

export interface UpdateEmployeeInput {
  departmentId?: string | null;
  designation?: string;
  joiningDate?: string;
  reportingManagerId?: string | null;
  salary?: number;
  status?: EmploymentStatus;
  city?: string;
  country?: string;
  emergencyContactName?: string;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const res = await apiClient.patch<Envelope<Employee>>(`/employees/${id}`, input);
  return res.data.data;
}

export async function deactivateEmployee(id: string) {
  const res = await apiClient.delete<Envelope<Employee>>(`/employees/${id}`);
  return res.data.data;
}

// -- Attendance -------------------------------------------------------------

export async function checkIn() {
  const res = await apiClient.post<Envelope<AttendanceRecord>>('/attendance/check-in');
  return res.data.data;
}

export async function checkOut() {
  const res = await apiClient.post<Envelope<AttendanceRecord>>('/attendance/check-out');
  return res.data.data;
}

export async function fetchMyAttendance(page = 1, limit = 30) {
  const res = await apiClient.get<PaginatedEnvelope<AttendanceRecord>>('/attendance/me', { params: { page, limit } });
  return res.data;
}

export async function fetchEmployeeAttendance(employeeId: string, page = 1, limit = 30) {
  const res = await apiClient.get<PaginatedEnvelope<AttendanceRecord>>(`/attendance/${employeeId}`, { params: { page, limit } });
  return res.data;
}

// -- Leave requests -----------------------------------------------------

export interface CreateLeaveRequestInput {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput) {
  const res = await apiClient.post<Envelope<LeaveRequest>>('/leave-requests', input);
  return res.data.data;
}

export async function fetchMyLeaveRequests(page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<LeaveRequest>>('/leave-requests/me', { params: { page, limit } });
  return res.data;
}

export async function fetchAllLeaveRequests(status?: LeaveStatus, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<LeaveRequest>>('/leave-requests', { params: { status, page, limit } });
  return res.data;
}

export async function fetchLeaveRequest(id: string) {
  const res = await apiClient.get<Envelope<LeaveRequest>>(`/leave-requests/${id}`);
  return res.data.data;
}

export async function decideLeaveRequest(id: string, approve: boolean) {
  const res = await apiClient.patch<Envelope<LeaveRequest>>(`/leave-requests/${id}/${approve ? 'approve' : 'reject'}`);
  return res.data.data;
}

// -- Payroll --------------------------------------------------------------

export async function fetchMyPayslips(page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<PayslipItem>>('/payroll/me', { params: { page, limit } });
  return res.data;
}

export interface TriggerPayrollRunInput {
  month: number;
  year: number;
  scope?: PayrollRunScope;
  employeeIds?: string[];
}

export async function triggerPayrollRun(input: TriggerPayrollRunInput) {
  const res = await apiClient.post<Envelope<TriggerPayrollRunResult>>('/payroll/runs', input);
  return res.data.data;
}

export async function fetchPayrollRuns(page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<PayrollRun>>('/payroll/runs', { params: { page, limit } });
  return res.data;
}

export async function fetchPayrollRun(id: string) {
  const res = await apiClient.get<Envelope<PayrollRunDetail>>(`/payroll/runs/${id}`);
  return res.data.data;
}

export async function fetchPayrollAdjustments(month: number, year: number, employeeIds?: string[]) {
  const res = await apiClient.get<Envelope<PayrollAdjustmentsResponse>>('/payroll/adjustments', {
    params: { month, year, employeeIds: employeeIds?.length ? employeeIds.join(',') : undefined },
  });
  return res.data.data;
}

export interface PayrollAdjustmentInput {
  employeeId: string;
  bonus?: number;
  deduction?: number;
}

export async function savePayrollAdjustments(month: number, year: number, adjustments: PayrollAdjustmentInput[]) {
  const res = await apiClient.put<Envelope<PayrollAdjustmentsResponse>>('/payroll/adjustments', {
    month,
    year,
    adjustments,
  });
  return res.data.data;
}

// -- Performance reviews ----------------------------------------------------

export interface CreatePerformanceReviewInput {
  periodStart: string;
  periodEnd: string;
  rating: number;
  notes?: string;
}

export async function createPerformanceReview(employeeId: string, input: CreatePerformanceReviewInput) {
  const res = await apiClient.post<Envelope<PerformanceReview>>(`/employees/${employeeId}/performance-reviews`, input);
  return res.data.data;
}

export async function fetchEmployeePerformanceReviews(employeeId: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<PerformanceReview>>(`/employees/${employeeId}/performance-reviews`, {
    params: { page, limit },
  });
  return res.data;
}

export async function fetchMyPerformanceReviews(page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<PerformanceReview>>('/performance-reviews/me', { params: { page, limit } });
  return res.data;
}
