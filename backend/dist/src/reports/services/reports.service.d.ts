import { DealsService } from '../../crm/services/deals.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { InvoicesService } from '../../sales/services/invoices.service';
import { ReportsService as FinanceReportsService } from '../../finance/services/reports.service';
import { ReportExportService } from './report-export.service';
import { SalesPerformanceReportQueryDto } from '../dto/sales-performance-report-query.dto';
import { HrReportQueryDto } from '../dto/hr-report-query.dto';
import { FinanceOverviewReportQueryDto } from '../dto/finance-overview-report-query.dto';
import { ReportExportFormat } from '../dto/report-export-format';
export declare class ReportsService {
    private readonly dealsService;
    private readonly employeesService;
    private readonly invoicesService;
    private readonly financeReportsService;
    private readonly reportExportService;
    constructor(dealsService: DealsService, employeesService: EmployeesService, invoicesService: InvoicesService, financeReportsService: FinanceReportsService, reportExportService: ReportExportService);
    salesPerformance(query: SalesPerformanceReportQueryDto): Promise<{
        byRep: {
            displayName: string;
            winRate: number;
            assignedToUserId: string | null;
            totalDeals: number;
            wonDeals: number;
            lostDeals: number;
            openDeals: number;
            wonValue: number;
        }[];
        winRate: number;
        totalDeals: number;
        wonDeals: number;
        lostDeals: number;
        openDeals: number;
        wonValue: number;
        dateFrom: string;
        dateTo: string;
    }>;
    hrReport(query: HrReportQueryDto): Promise<{
        dateFrom: string;
        dateTo: string;
        headcount: number;
        totalAttendanceDays: number;
        dailyAttendance: {
            date: string;
            present: number;
        }[];
        totalLeaveRequests: number;
        leaveByType: {
            leaveType: string;
            pending: number;
            approved: number;
            rejected: number;
        }[];
    }>;
    financeOverview(query: FinanceOverviewReportQueryDto): Promise<{
        outstandingInvoicesCount: number;
        outstandingInvoicesTotal: number;
        dateFrom: string;
        dateTo: string;
        income: number;
        expenses: number;
        netProfit: number;
        byCategory: {
            type: import("@prisma/client").$Enums.TransactionType;
            category: string;
            total: number;
        }[];
    }>;
    exportSalesPerformance(query: SalesPerformanceReportQueryDto, format: ReportExportFormat): Promise<Buffer>;
    exportHrReport(query: HrReportQueryDto, format: ReportExportFormat): Promise<Buffer>;
    exportFinanceOverview(query: FinanceOverviewReportQueryDto, format: ReportExportFormat): Promise<Buffer>;
    private render;
}
