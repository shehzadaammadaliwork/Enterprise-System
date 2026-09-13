export interface UpcomingEvent {
  id: string;
  eventType: 'MEETING' | 'DEADLINE' | 'LEAVE' | 'HOLIDAY';
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
}

export interface PersonalSummary {
  /// null when not checked in yet today (or no Employee profile at all —
  /// e.g. the bootstrap Admin).
  attendanceToday: { checkInAt: string | null; checkOutAt: string | null } | null;
  pendingLeaveRequests: number;
  approvedLeaveDaysThisYear: number;
  upcomingEvents: UpcomingEvent[];
  unreadNotificationsCount: number;
}

export interface HrSummary {
  headcount: number;
  presentToday: number;
  pendingLeaveRequests: number;
}

export interface SalesSummary {
  openDealCount: number;
  openPipelineValue: number;
  revenueThisMonth: number;
}

export interface FinanceSummary {
  cashPosition: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesTotal: number;
}

export interface DashboardSummary {
  /// Unlike hr/sales/finance below, this is never null — it's the
  /// caller's own self-service data (attendance/leave/calendar/
  /// notifications), shown to every authenticated employee regardless of
  /// RBAC permissions, same as /my-work needing no specific permission.
  personal: PersonalSummary;
  /// Each section is null when the caller lacks the underlying permission
  /// — the backend omits it entirely rather than the frontend hiding it,
  /// same "server decides what's visible" precedent as Employee.salary.
  hr: HrSummary | null;
  sales: SalesSummary | null;
  finance: FinanceSummary | null;
}
