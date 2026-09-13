"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("../../rbac/rbac.service");
const employees_service_1 = require("../../employees/services/employees.service");
const attendance_service_1 = require("../../employees/services/attendance.service");
const leave_service_1 = require("../../employees/services/leave.service");
const calendar_events_service_1 = require("../../calendar/services/calendar-events.service");
const notifications_service_1 = require("../../notifications/services/notifications.service");
const deals_service_1 = require("../../crm/services/deals.service");
const payments_service_1 = require("../../sales/services/payments.service");
const invoices_service_1 = require("../../sales/services/invoices.service");
const bank_accounts_service_1 = require("../../finance/services/bank-accounts.service");
let DashboardService = class DashboardService {
    rbacService;
    employeesService;
    attendanceService;
    leaveService;
    calendarEventsService;
    notificationsService;
    dealsService;
    paymentsService;
    invoicesService;
    bankAccountsService;
    constructor(rbacService, employeesService, attendanceService, leaveService, calendarEventsService, notificationsService, dealsService, paymentsService, invoicesService, bankAccountsService) {
        this.rbacService = rbacService;
        this.employeesService = employeesService;
        this.attendanceService = attendanceService;
        this.leaveService = leaveService;
        this.calendarEventsService = calendarEventsService;
        this.notificationsService = notificationsService;
        this.dealsService = dealsService;
        this.paymentsService = paymentsService;
        this.invoicesService = invoicesService;
        this.bankAccountsService = bankAccountsService;
    }
    async getSummary(userId) {
        const [canViewHr, canViewSales, canViewFinance] = await Promise.all([
            this.rbacService.userHasPermission(userId, 'employees', 'VIEW'),
            this.rbacService.userHasPermission(userId, 'sales', 'VIEW'),
            this.rbacService.userHasPermission(userId, 'finance', 'VIEW'),
        ]);
        const [personal, hr, pipeline, revenue, cashPosition, outstandingInvoices] = await Promise.all([
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
            sales: canViewSales && pipeline && revenue
                ? { ...pipeline, ...revenue }
                : null,
            finance: canViewFinance && cashPosition && outstandingInvoices
                ? { ...cashPosition, ...outstandingInvoices }
                : null,
        };
    }
    async getPersonalSummary(userId) {
        const employeeId = await this.employeesService.findEmployeeIdByUserId(userId);
        const [attendanceToday, leave, upcomingEvents, unreadNotificationsCount] = await Promise.all([
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rbac_service_1.RbacService,
        employees_service_1.EmployeesService,
        attendance_service_1.AttendanceService,
        leave_service_1.LeaveService,
        calendar_events_service_1.CalendarEventsService,
        notifications_service_1.NotificationsService,
        deals_service_1.DealsService,
        payments_service_1.PaymentsService,
        invoices_service_1.InvoicesService,
        bank_accounts_service_1.BankAccountsService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map