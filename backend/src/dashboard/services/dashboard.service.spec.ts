import { DashboardService } from './dashboard.service';
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

/// Everything mocked (no real DB). Two things matter here: (1) the existing
/// per-section permission gating for hr/sales/finance is untouched, and
/// (2) the new `personal` section is always populated for any authenticated
/// user regardless of permissions — including a zero-role employee and a
/// user with no Employee profile at all (e.g. the bootstrap Admin).
describe('DashboardService', () => {
  let service: DashboardService;
  let rbacService: { userHasPermission: jest.Mock };
  let employeesService: {
    getHrSummary: jest.Mock;
    findEmployeeIdByUserId: jest.Mock;
  };
  let attendanceService: { getTodayRecord: jest.Mock };
  let leaveService: { getMyLeaveSummary: jest.Mock };
  let calendarEventsService: { listUpcomingForUser: jest.Mock };
  let notificationsService: { getUnreadCount: jest.Mock };
  let dealsService: { getPipelineSummary: jest.Mock };
  let paymentsService: { getRevenueThisMonth: jest.Mock };
  let invoicesService: { getOutstandingSummary: jest.Mock };
  let bankAccountsService: { getCashPosition: jest.Mock };

  beforeEach(() => {
    rbacService = { userHasPermission: jest.fn().mockResolvedValue(false) };
    employeesService = {
      getHrSummary: jest.fn().mockResolvedValue({
        headcount: 10,
        presentToday: 8,
        pendingLeaveRequests: 2,
      }),
      findEmployeeIdByUserId: jest.fn().mockResolvedValue('emp-1'),
    };
    attendanceService = {
      getTodayRecord: jest.fn().mockResolvedValue({
        checkInAt: new Date('2026-01-01T09:00:00Z'),
        checkOutAt: null,
      }),
    };
    leaveService = {
      getMyLeaveSummary: jest.fn().mockResolvedValue({
        pendingLeaveRequests: 1,
        approvedDaysThisYear: 4,
      }),
    };
    calendarEventsService = {
      listUpcomingForUser: jest
        .fn()
        .mockResolvedValue([{ id: 'evt-1', title: 'Standup' }]),
    };
    notificationsService = {
      getUnreadCount: jest.fn().mockResolvedValue(3),
    };
    dealsService = {
      getPipelineSummary: jest
        .fn()
        .mockResolvedValue({ openDealCount: 5, openPipelineValue: 50000 }),
    };
    paymentsService = {
      getRevenueThisMonth: jest
        .fn()
        .mockResolvedValue({ revenueThisMonth: 12000 }),
    };
    invoicesService = {
      getOutstandingSummary: jest.fn().mockResolvedValue({
        outstandingInvoicesCount: 3,
        outstandingInvoicesTotal: 4500,
      }),
    };
    bankAccountsService = {
      getCashPosition: jest.fn().mockResolvedValue({ cashPosition: 99000 }),
    };
    service = new DashboardService(
      rbacService as unknown as RbacService,
      employeesService as unknown as EmployeesService,
      attendanceService as unknown as AttendanceService,
      leaveService as unknown as LeaveService,
      calendarEventsService as unknown as CalendarEventsService,
      notificationsService as unknown as NotificationsService,
      dealsService as unknown as DealsService,
      paymentsService as unknown as PaymentsService,
      invoicesService as unknown as InvoicesService,
      bankAccountsService as unknown as BankAccountsService,
    );
  });

  describe('hr/sales/finance permission gating (unchanged)', () => {
    it('omits every business section and calls no backing service when the user holds no VIEW permissions', async () => {
      const summary = await service.getSummary('user-1');

      expect(summary.hr).toBeNull();
      expect(summary.sales).toBeNull();
      expect(summary.finance).toBeNull();
      expect(employeesService.getHrSummary).not.toHaveBeenCalled();
      expect(dealsService.getPipelineSummary).not.toHaveBeenCalled();
      expect(bankAccountsService.getCashPosition).not.toHaveBeenCalled();
    });

    it('includes only the sections the caller has permission for', async () => {
      rbacService.userHasPermission.mockImplementation(
        (_userId: string, module: string) =>
          Promise.resolve(module === 'employees'),
      );

      const summary = await service.getSummary('user-1');

      expect(summary.hr).toEqual({
        headcount: 10,
        presentToday: 8,
        pendingLeaveRequests: 2,
      });
      expect(summary.sales).toBeNull();
      expect(summary.finance).toBeNull();
      expect(dealsService.getPipelineSummary).not.toHaveBeenCalled();
    });

    it('merges pipeline and revenue into one sales section, and cash position with outstanding invoices into one finance section', async () => {
      rbacService.userHasPermission.mockImplementation(
        (_userId: string, module: string) =>
          Promise.resolve(module === 'sales' || module === 'finance'),
      );

      const summary = await service.getSummary('user-1');

      expect(summary.sales).toEqual({
        openDealCount: 5,
        openPipelineValue: 50000,
        revenueThisMonth: 12000,
      });
      expect(summary.finance).toEqual({
        cashPosition: 99000,
        outstandingInvoicesCount: 3,
        outstandingInvoicesTotal: 4500,
      });
    });
  });

  describe('personal section — always present, regardless of RBAC permissions', () => {
    it('is populated even when the caller holds zero permissions (the zero-role-employee case)', async () => {
      const summary = await service.getSummary('zero-role-user');

      expect(summary.personal).toEqual({
        attendanceToday: {
          checkInAt: new Date('2026-01-01T09:00:00Z'),
          checkOutAt: null,
        },
        pendingLeaveRequests: 1,
        approvedLeaveDaysThisYear: 4,
        upcomingEvents: [{ id: 'evt-1', title: 'Standup' }],
        unreadNotificationsCount: 3,
      });
    });

    it('is populated the same way for a caller with full business-module permissions — not an either/or with hr/sales/finance', async () => {
      rbacService.userHasPermission.mockResolvedValue(true);

      const summary = await service.getSummary('admin-with-employee-profile');

      expect(summary.personal.unreadNotificationsCount).toBe(3);
      expect(summary.hr).not.toBeNull();
    });

    it('gracefully degrades attendance/leave to null/zero for a user with no Employee profile, while events/notifications still populate', async () => {
      employeesService.findEmployeeIdByUserId.mockResolvedValue(null);

      const summary = await service.getSummary('bootstrap-admin');

      expect(summary.personal.attendanceToday).toBeNull();
      expect(summary.personal.pendingLeaveRequests).toBe(0);
      expect(summary.personal.approvedLeaveDaysThisYear).toBe(0);
      expect(attendanceService.getTodayRecord).not.toHaveBeenCalled();
      expect(leaveService.getMyLeaveSummary).not.toHaveBeenCalled();
      // Neither of these is Employee-scoped — both keyed by User directly.
      expect(summary.personal.upcomingEvents).toEqual([
        { id: 'evt-1', title: 'Standup' },
      ]);
      expect(summary.personal.unreadNotificationsCount).toBe(3);
    });

    it('reports no attendance record yet as null, not a fabricated zero/empty object', async () => {
      attendanceService.getTodayRecord.mockResolvedValue(null);

      const summary = await service.getSummary('user-1');

      expect(summary.personal.attendanceToday).toBeNull();
    });
  });
});
