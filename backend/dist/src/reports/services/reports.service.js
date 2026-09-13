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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const deals_service_1 = require("../../crm/services/deals.service");
const employees_service_1 = require("../../employees/services/employees.service");
const invoices_service_1 = require("../../sales/services/invoices.service");
const reports_service_1 = require("../../finance/services/reports.service");
const report_export_service_1 = require("./report-export.service");
function money(value) {
    return value.toFixed(2);
}
function percent(value) {
    return `${(value * 100).toFixed(1)}%`;
}
let ReportsService = class ReportsService {
    dealsService;
    employeesService;
    invoicesService;
    financeReportsService;
    reportExportService;
    constructor(dealsService, employeesService, invoicesService, financeReportsService, reportExportService) {
        this.dealsService = dealsService;
        this.employeesService = employeesService;
        this.invoicesService = invoicesService;
        this.financeReportsService = financeReportsService;
        this.reportExportService = reportExportService;
    }
    async salesPerformance(query) {
        const report = await this.dealsService.getPerformanceReport(new Date(query.dateFrom), new Date(query.dateTo), query.assignedToUserId);
        const repUserIds = report.byRep
            .map((rep) => rep.assignedToUserId)
            .filter((id) => id !== null);
        const names = await this.employeesService.resolveUserDisplayNames(repUserIds);
        return {
            ...report,
            byRep: report.byRep.map((rep) => ({
                ...rep,
                displayName: rep.assignedToUserId
                    ? (names[rep.assignedToUserId] ?? 'Unknown user')
                    : 'Unassigned',
            })),
        };
    }
    async hrReport(query) {
        return this.employeesService.getHrReport(new Date(query.dateFrom), new Date(query.dateTo));
    }
    async financeOverview(query) {
        const [pnl, outstanding] = await Promise.all([
            this.financeReportsService.profitAndLoss({
                dateFrom: query.dateFrom,
                dateTo: query.dateTo,
            }),
            this.invoicesService.getOutstandingSummary(),
        ]);
        return { ...pnl, ...outstanding };
    }
    async exportSalesPerformance(query, format) {
        const report = await this.salesPerformance(query);
        const doc = {
            title: 'Sales Performance Report',
            subtitle: `${query.dateFrom} to ${query.dateTo}`,
            summary: [
                { label: 'Total deals', value: String(report.totalDeals) },
                { label: 'Won deals', value: String(report.wonDeals) },
                { label: 'Lost deals', value: String(report.lostDeals) },
                { label: 'Open deals', value: String(report.openDeals) },
                { label: 'Won value', value: money(report.wonValue) },
                { label: 'Win rate', value: percent(report.winRate) },
            ],
            tables: [
                {
                    title: 'By rep',
                    columns: [
                        'Rep',
                        'Total',
                        'Won',
                        'Lost',
                        'Open',
                        'Won value',
                        'Win rate',
                    ],
                    rows: report.byRep.map((rep) => [
                        rep.displayName,
                        rep.totalDeals,
                        rep.wonDeals,
                        rep.lostDeals,
                        rep.openDeals,
                        money(rep.wonValue),
                        percent(rep.winRate),
                    ]),
                },
            ],
        };
        return this.render(doc, format);
    }
    async exportHrReport(query, format) {
        const report = await this.hrReport(query);
        const doc = {
            title: 'HR Report',
            subtitle: `${query.dateFrom} to ${query.dateTo}`,
            summary: [
                { label: 'Active headcount', value: String(report.headcount) },
                {
                    label: 'Total attendance days',
                    value: String(report.totalAttendanceDays),
                },
                {
                    label: 'Total leave requests',
                    value: String(report.totalLeaveRequests),
                },
            ],
            tables: [
                {
                    title: 'Daily attendance',
                    columns: ['Date', 'Present'],
                    rows: report.dailyAttendance.map((d) => [d.date, d.present]),
                },
                {
                    title: 'Leave by type',
                    columns: ['Leave type', 'Pending', 'Approved', 'Rejected'],
                    rows: report.leaveByType.map((l) => [
                        l.leaveType,
                        l.pending,
                        l.approved,
                        l.rejected,
                    ]),
                },
            ],
        };
        return this.render(doc, format);
    }
    async exportFinanceOverview(query, format) {
        const report = await this.financeOverview(query);
        const doc = {
            title: 'Finance Report',
            subtitle: `${query.dateFrom} to ${query.dateTo}`,
            summary: [
                { label: 'Income', value: money(report.income) },
                { label: 'Expenses', value: money(report.expenses) },
                { label: 'Net profit', value: money(report.netProfit) },
                {
                    label: 'Outstanding invoices',
                    value: String(report.outstandingInvoicesCount),
                },
                {
                    label: 'Outstanding total',
                    value: money(report.outstandingInvoicesTotal),
                },
            ],
            tables: [
                {
                    title: 'Income & expenses by category',
                    columns: ['Type', 'Category', 'Total'],
                    rows: report.byCategory.map((row) => [
                        row.type,
                        row.category,
                        money(row.total),
                    ]),
                },
            ],
        };
        return this.render(doc, format);
    }
    render(doc, format) {
        return format === 'pdf'
            ? this.reportExportService.generatePdf(doc)
            : this.reportExportService.generateExcel(doc);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [deals_service_1.DealsService,
        employees_service_1.EmployeesService,
        invoices_service_1.InvoicesService,
        reports_service_1.ReportsService,
        report_export_service_1.ReportExportService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map