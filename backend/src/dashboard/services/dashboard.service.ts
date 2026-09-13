import { Injectable } from '@nestjs/common';
import { RbacService } from '../../rbac/rbac.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { AttendanceService } from '../../employees/services/attendance.service';
import { LeaveService } from '../../employees/services/leave.service';
import { CalendarEventsService } from '../../calendar/services/calendar-events.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DealsService } from '../../crm/services/deals.service';
import { PaymentsService } from '../../sales/services/payments.service';
import { InvoicesService } from '../../sales/services/invoices.service';
import { BankAccountsService } from '../../finance/services/bank-accounts.service';

/// Spec: "Real widgets: HR summary for HR/Admin; Sales summary for Sales
/// roles; Finance summary for Finance/Admin" — read here as a permission
/// check, not a fixed-role check (same convention every nav item and
/// PermissionGuard in this app already uses), so one combined endpoint
/// can serve every user and just omit the sections they can't see. Each
/// section's numbers come from an already-exported read method on the
/// module that actually owns that data — this service never queries
/// another module's tables directly.
///
/// The `personal` section (Dashboard gap fix: engineering/design roles
/// with no business-module permissions were seeing an empty dashboard)
/// is the one exception to the permission-gating pattern above — it's
/// always populated for any authenticated user, the same way `/my-work`
/// and every other self-service "me" endpoint in this app needs no
/// specific RBAC permission, only authentication. It's what an employee
/// with zero RBAC roles still sees (per the multi-role RBAC system's own
/// zero-role-fallback decision) instead of a blank page.
@Injectable()
export class DashboardService {
  constructor(
    private readonly rbacService: RbacService,
    private readonly employeesService: EmployeesService,
    private readonly attendanceService: AttendanceService,
    private readonly leaveService: LeaveService,
    private readonly calendarEventsService: CalendarEventsService,
    private readonly notificationsService: NotificationsService,
    private readonly dealsService: DealsService,
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  async getSummary(userId: string) {
    const [canViewHr, canViewSales, canViewFinance] = await Promise.all([
      this.rbacService.userHasPermission(userId, 'employees', 'VIEW'),
      this.rbacService.userHasPermission(userId, 'sales', 'VIEW'),
      this.rbacService.userHasPermission(userId, 'finance', 'VIEW'),
    ]);

    const [personal, hr, pipeline, revenue, cashPosition, outstandingInvoices] =
      await Promise.all([
        this.getPersonalSummary(userId),
        canViewHr ? this.employeesService.getHrSummary() : null,
        canViewSales ? this.dealsService.getPipelineSummary() : null,
        canViewSales ? this.paymentsService.getRevenueThisMonth() : null,
        canViewFinance ? this.bankAccountsService.getCashPosition() : null,
        canViewFinance ? this.invoicesService.getOutstandingSummary() : null,
      ]);

    return {
      personal,
      hr,
      sales:
        canViewSales && pipeline && revenue
          ? { ...pipeline, ...revenue }
          : null,
      finance:
        canViewFinance && cashPosition && outstandingInvoices
          ? { ...cashPosition, ...outstandingInvoices }
          : null,
    };
  }

  /// Built entirely from data the caller already has unconditional
  /// self-service access to elsewhere in the app (attendance/leave "me"
  /// endpoints, the calendar view, the notification bell) — no RBAC
  /// permission gate, same as those. A caller with no Employee profile at
  /// all (e.g. the bootstrap Admin) simply gets null attendance/leave —
  /// there's nothing to report — while events/notifications, which are
  /// keyed by User not Employee, still populate normally.
  private async getPersonalSummary(userId: string) {
    const employeeId =
      await this.employeesService.findEmployeeIdByUserId(userId);

    const [attendanceToday, leave, upcomingEvents, unreadNotificationsCount] =
      await Promise.all([
        employeeId ? this.attendanceService.getTodayRecord(employeeId) : null,
        employeeId ? this.leaveService.getMyLeaveSummary(employeeId) : null,
        this.calendarEventsService.listUpcomingForUser(userId),
        this.notificationsService.getUnreadCount(userId),
      ]);

    return {
      attendanceToday: attendanceToday
        ? {
            checkInAt: attendanceToday.checkInAt,
            checkOutAt: attendanceToday.checkOutAt,
          }
        : null,
      pendingLeaveRequests: leave?.pendingLeaveRequests ?? 0,
      approvedLeaveDaysThisYear: leave?.approvedDaysThisYear ?? 0,
      upcomingEvents,
      unreadNotificationsCount,
    };
  }
}
