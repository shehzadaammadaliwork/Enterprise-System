import { StreamableFile } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { SalesPerformanceReportQueryDto } from '../dto/sales-performance-report-query.dto';
import { ExportSalesPerformanceReportQueryDto } from '../dto/export-sales-performance-report-query.dto';
import { HrReportQueryDto } from '../dto/hr-report-query.dto';
import { ExportHrReportQueryDto } from '../dto/export-hr-report-query.dto';
import { FinanceOverviewReportQueryDto } from '../dto/finance-overview-report-query.dto';
import { ExportFinanceOverviewReportQueryDto } from '../dto/export-finance-overview-report-query.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
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
    exportSalesPerformance(query: ExportSalesPerformanceReportQueryDto): Promise<StreamableFile>;
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
    exportHrReport(query: ExportHrReportQueryDto): Promise<StreamableFile>;
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
    exportFinanceOverview(query: ExportFinanceOverviewReportQueryDto): Promise<StreamableFile>;
}
