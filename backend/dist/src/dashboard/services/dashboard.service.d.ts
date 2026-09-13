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
export declare class DashboardService {
    private readonly rbacService;
    private readonly employeesService;
    private readonly attendanceService;
    private readonly leaveService;
    private readonly calendarEventsService;
    private readonly notificationsService;
    private readonly dealsService;
    private readonly paymentsService;
    private readonly invoicesService;
    private readonly bankAccountsService;
    constructor(rbacService: RbacService, employeesService: EmployeesService, attendanceService: AttendanceService, leaveService: LeaveService, calendarEventsService: CalendarEventsService, notificationsService: NotificationsService, dealsService: DealsService, paymentsService: PaymentsService, invoicesService: InvoicesService, bankAccountsService: BankAccountsService);
    getSummary(userId: string): Promise<{
        personal: {
            attendanceToday: {
                checkInAt: Date | null;
                checkOutAt: Date | null;
            } | null;
            pendingLeaveRequests: number;
            approvedLeaveDaysThisYear: number;
            upcomingEvents: import("../../calendar/services/calendar-events.service").CalendarEventView[];
            unreadNotificationsCount: number;
        };
        hr: {
            headcount: number;
            presentToday: number;
            pendingLeaveRequests: number;
        } | null;
        sales: {
            revenueThisMonth: number;
            openDealCount: number;
            openPipelineValue: number;
        } | null;
        finance: {
            outstandingInvoicesCount: number;
            outstandingInvoicesTotal: number;
            cashPosition: number;
        } | null;
    }>;
    private getPersonalSummary;
}
