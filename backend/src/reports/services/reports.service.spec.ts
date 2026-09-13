import { ReportsService } from './reports.service';
import { DealsService } from '../../crm/services/deals.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { InvoicesService } from '../../sales/services/invoices.service';
import { ReportsService as FinanceReportsService } from '../../finance/services/reports.service';
import { ReportExportService } from './report-export.service';

/// Everything mocked (no real DB) — mirrors DashboardService's spec style.
/// What matters here: each report method delegates to the right owning
/// module's already-exported aggregation, the sales-performance rep display
/// names resolve/fall back correctly, and export routes pick pdf vs. excel.
describe('ReportsService', () => {
  let service: ReportsService;
  let dealsService: { getPerformanceReport: jest.Mock };
  let employeesService: {
    getHrReport: jest.Mock;
    resolveUserDisplayNames: jest.Mock;
  };
  let invoicesService: { getOutstandingSummary: jest.Mock };
  let financeReportsService: { profitAndLoss: jest.Mock };
  let reportExportService: { generatePdf: jest.Mock; generateExcel: jest.Mock };

  beforeEach(() => {
    dealsService = {
      getPerformanceReport: jest.fn().mockResolvedValue({
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T00:00:00.000Z',
        totalDeals: 3,
        wonDeals: 1,
        lostDeals: 1,
        openDeals: 1,
        wonValue: 5000,
        winRate: 0.5,
        byRep: [
          {
            assignedToUserId: 'user-1',
            totalDeals: 2,
            wonDeals: 1,
            lostDeals: 1,
            openDeals: 0,
            wonValue: 5000,
            winRate: 0.5,
          },
          {
            assignedToUserId: null,
            totalDeals: 1,
            wonDeals: 0,
            lostDeals: 0,
            openDeals: 1,
            wonValue: 0,
            winRate: 0,
          },
        ],
      }),
    };
    employeesService = {
      getHrReport: jest.fn().mockResolvedValue({
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T00:00:00.000Z',
        headcount: 10,
        totalAttendanceDays: 200,
        dailyAttendance: [{ date: '2026-01-05', present: 9 }],
        totalLeaveRequests: 4,
        leaveByType: [
          { leaveType: 'SICK', pending: 1, approved: 2, rejected: 1 },
        ],
      }),
      resolveUserDisplayNames: jest
        .fn()
        .mockResolvedValue({ 'user-1': 'Jane Doe' }),
    };
    invoicesService = {
      getOutstandingSummary: jest.fn().mockResolvedValue({
        outstandingInvoicesCount: 2,
        outstandingInvoicesTotal: 1500,
      }),
    };
    financeReportsService = {
      profitAndLoss: jest.fn().mockResolvedValue({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        income: 10000,
        expenses: 4000,
        netProfit: 6000,
        byCategory: [{ type: 'INCOME', category: 'Sales', total: 10000 }],
      }),
    };
    reportExportService = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
      generateExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
    };

    service = new ReportsService(
      dealsService as unknown as DealsService,
      employeesService as unknown as EmployeesService,
      invoicesService as unknown as InvoicesService,
      financeReportsService as unknown as FinanceReportsService,
      reportExportService as unknown as ReportExportService,
    );
  });

  describe('salesPerformance', () => {
    it('resolves a display name for a rep with an employee profile, and falls back for unassigned deals', async () => {
      const result = await service.salesPerformance({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(employeesService.resolveUserDisplayNames).toHaveBeenCalledWith([
        'user-1',
      ]);
      expect(result.byRep[0].displayName).toBe('Jane Doe');
      expect(result.byRep[1].displayName).toBe('Unassigned');
    });

    it('falls back to "Unknown user" when a rep id has no resolvable employee profile', async () => {
      employeesService.resolveUserDisplayNames.mockResolvedValue({});

      const result = await service.salesPerformance({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(result.byRep[0].displayName).toBe('Unknown user');
    });
  });

  describe('hrReport', () => {
    it('delegates to EmployeesService.getHrReport with Date-converted bounds', async () => {
      await service.hrReport({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });

      const [dateFrom, dateTo] = employeesService.getHrReport.mock.calls[0];
      expect(dateFrom).toBeInstanceOf(Date);
      expect(dateTo).toBeInstanceOf(Date);
    });
  });

  describe('financeOverview', () => {
    it('merges profit-and-loss with the outstanding-invoices summary', async () => {
      const result = await service.financeOverview({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(result).toEqual(
        expect.objectContaining({
          income: 10000,
          expenses: 4000,
          netProfit: 6000,
          outstandingInvoicesCount: 2,
          outstandingInvoicesTotal: 1500,
        }),
      );
    });
  });

  describe('export routes', () => {
    it('renders PDF via ReportExportService.generatePdf when format=pdf', async () => {
      await service.exportFinanceOverview(
        { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        'pdf',
      );
      expect(reportExportService.generatePdf).toHaveBeenCalled();
      expect(reportExportService.generateExcel).not.toHaveBeenCalled();
    });

    it('renders Excel via ReportExportService.generateExcel when format=excel', async () => {
      await service.exportHrReport(
        { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        'excel',
      );
      expect(reportExportService.generateExcel).toHaveBeenCalled();
      expect(reportExportService.generatePdf).not.toHaveBeenCalled();
    });
  });
});
