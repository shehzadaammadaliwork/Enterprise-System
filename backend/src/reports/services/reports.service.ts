import { Injectable } from '@nestjs/common';
import { DealsService } from '../../crm/services/deals.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { InvoicesService } from '../../sales/services/invoices.service';
import { ReportsService as FinanceReportsService } from '../../finance/services/reports.service';
import { ReportExportService, ReportDocument } from './report-export.service';
import { SalesPerformanceReportQueryDto } from '../dto/sales-performance-report-query.dto';
import { HrReportQueryDto } from '../dto/hr-report-query.dto';
import { FinanceOverviewReportQueryDto } from '../dto/finance-overview-report-query.dto';
import { ReportExportFormat } from '../dto/report-export-format';

function money(value: number): string {
  return value.toFixed(2);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/// One GET route per report, each mapping to a small aggregation already
/// exported by the module that owns the underlying data (DealsService for
/// CRM, EmployeesService for HR, FinanceModule's own ReportsService +
/// Sales' InvoicesService for the Finance overview) — this service never
/// queries another module's tables directly, same rule DashboardService
/// (Module 16) already established.
@Injectable()
export class ReportsService {
  constructor(
    private readonly dealsService: DealsService,
    private readonly employeesService: EmployeesService,
    private readonly invoicesService: InvoicesService,
    private readonly financeReportsService: FinanceReportsService,
    private readonly reportExportService: ReportExportService,
  ) {}

  async salesPerformance(query: SalesPerformanceReportQueryDto) {
    const report = await this.dealsService.getPerformanceReport(
      new Date(query.dateFrom),
      new Date(query.dateTo),
      query.assignedToUserId,
    );
    const repUserIds = report.byRep
      .map((rep) => rep.assignedToUserId)
      .filter((id): id is string => id !== null);
    const names =
      await this.employeesService.resolveUserDisplayNames(repUserIds);
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

  async hrReport(query: HrReportQueryDto) {
    return this.employeesService.getHrReport(
      new Date(query.dateFrom),
      new Date(query.dateTo),
    );
  }

  async financeOverview(query: FinanceOverviewReportQueryDto) {
    const [pnl, outstanding] = await Promise.all([
      this.financeReportsService.profitAndLoss({
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
      this.invoicesService.getOutstandingSummary(),
    ]);
    return { ...pnl, ...outstanding };
  }

  async exportSalesPerformance(
    query: SalesPerformanceReportQueryDto,
    format: ReportExportFormat,
  ): Promise<Buffer> {
    const report = await this.salesPerformance(query);
    const doc: ReportDocument = {
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

  async exportHrReport(
    query: HrReportQueryDto,
    format: ReportExportFormat,
  ): Promise<Buffer> {
    const report = await this.hrReport(query);
    const doc: ReportDocument = {
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

  async exportFinanceOverview(
    query: FinanceOverviewReportQueryDto,
    format: ReportExportFormat,
  ): Promise<Buffer> {
    const report = await this.financeOverview(query);
    const doc: ReportDocument = {
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

  private render(
    doc: ReportDocument,
    format: ReportExportFormat,
  ): Promise<Buffer> {
    return format === 'pdf'
      ? this.reportExportService.generatePdf(doc)
      : this.reportExportService.generateExcel(doc);
  }
}
