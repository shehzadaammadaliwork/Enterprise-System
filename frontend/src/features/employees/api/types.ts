export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
export type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollRunStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PayrollRunScope = 'ALL_ACTIVE' | 'SELECTED';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface EmployeeSummary {
  id: string;
  designation: string;
  user: UserSummary;
}

/// A registered User account, for the onboarding flow (Users page + the
/// "Add employee" user picker) — `hasEmployeeProfile` is what distinguishes
/// an already-onboarded account from one still eligible to be linked.
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  hasEmployeeProfile: boolean;
}

export interface Employee {
  id: string;
  userId: string;
  user: UserSummary;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  designation: string;
  joiningDate: string;
  reportingManagerId: string | null;
  reportingManager?: EmployeeSummary | null;
  /// Omitted by the API unless the caller holds `payroll:VIEW` (or this is
  /// their own record via GET /employees/me).
  salary?: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  status: EmploymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: EmployeeSummary;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  decidedByUserId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  scope: PayrollRunScope;
  selectedEmployeeIds: string[];
  triggeredByUserId: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

/// Trigger-only shape — a period can have more than one run over time, so a
/// new run may have silently excluded employees who already had a payslip
/// for this exact period from an earlier run. Reported once here so the
/// caller can tell Admin who was skipped and why.
export interface TriggerPayrollRunResult extends PayrollRun {
  skippedEmployeeIds: string[];
}

export interface PayslipItem {
  id: string;
  payrollRunId: string;
  payrollRun?: PayrollRun;
  employeeId: string;
  employee?: EmployeeSummary;
  basePay: number;
  bonus: number;
  deduction: number;
  net: number;
  createdAt: string;
}

export interface PayrollRunDetail extends PayrollRun {
  payslips: PayslipItem[];
}

export interface PayrollAdjustmentPreview {
  employeeId: string;
  designation: string;
  user: UserSummary;
  basePay: number;
  bonus: number;
  deduction: number;
}

export interface PayrollAdjustmentsResponse {
  locked: boolean;
  items: PayrollAdjustmentPreview[];
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  rating: number;
  notes: string | null;
  reviewerUserId: string;
  createdAt: string;
  updatedAt: string;
}
