export interface SalesPerformanceRepRow {
  assignedToUserId: string | null;
  displayName: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  wonValue: number;
  winRate: number;
}

export interface SalesPerformanceReport {
  dateFrom: string;
  dateTo: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  wonValue: number;
  winRate: number;
  byRep: SalesPerformanceRepRow[];
}

export interface HrReportDailyAttendance {
  date: string;
  present: number;
}

export interface HrReportLeaveByType {
  leaveType: string;
  pending: number;
  approved: number;
  rejected: number;
}

export interface HrReport {
  dateFrom: string;
  dateTo: string;
  headcount: number;
  totalAttendanceDays: number;
  dailyAttendance: HrReportDailyAttendance[];
  totalLeaveRequests: number;
  leaveByType: HrReportLeaveByType[];
}

export interface FinanceOverviewReport {
  dateFrom: string;
  dateTo: string;
  income: number;
  expenses: number;
  netProfit: number;
  byCategory: { type: 'INCOME' | 'EXPENSE'; category: string; total: number }[];
  outstandingInvoicesCount: number;
  outstandingInvoicesTotal: number;
}

export type ReportExportFormat = 'pdf' | 'excel';
