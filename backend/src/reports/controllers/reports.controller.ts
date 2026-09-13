import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { ReportsService } from '../services/reports.service';
import { SalesPerformanceReportQueryDto } from '../dto/sales-performance-report-query.dto';
import { ExportSalesPerformanceReportQueryDto } from '../dto/export-sales-performance-report-query.dto';
import { HrReportQueryDto } from '../dto/hr-report-query.dto';
import { ExportHrReportQueryDto } from '../dto/export-hr-report-query.dto';
import { FinanceOverviewReportQueryDto } from '../dto/finance-overview-report-query.dto';
import { ExportFinanceOverviewReportQueryDto } from '../dto/export-finance-overview-report-query.dto';

const MIME_TYPES = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

const EXTENSIONS = { pdf: 'pdf', excel: 'xlsx' } as const;

function toFile(buffer: Buffer, name: string, format: 'pdf' | 'excel') {
  return new StreamableFile(buffer, {
    type: MIME_TYPES[format],
    disposition: `attachment; filename="${name}.${EXTENSIONS[format]}"`,
  });
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-performance')
  @RequirePermission('reports', 'VIEW')
  salesPerformance(@Query() query: SalesPerformanceReportQueryDto) {
    return this.reportsService.salesPerformance(query);
  }

  @Get('sales-performance/export')
  @RequirePermission('reports', 'VIEW')
  async exportSalesPerformance(
    @Query() query: ExportSalesPerformanceReportQueryDto,
  ) {
    const buffer = await this.reportsService.exportSalesPerformance(
      query,
      query.format,
    );
    return toFile(buffer, 'sales-performance-report', query.format);
  }

  @Get('hr')
  @RequirePermission('reports', 'VIEW')
  hrReport(@Query() query: HrReportQueryDto) {
    return this.reportsService.hrReport(query);
  }

  @Get('hr/export')
  @RequirePermission('reports', 'VIEW')
  async exportHrReport(@Query() query: ExportHrReportQueryDto) {
    const buffer = await this.reportsService.exportHrReport(
      query,
      query.format,
    );
    return toFile(buffer, 'hr-report', query.format);
  }

  @Get('finance')
  @RequirePermission('reports', 'VIEW')
  financeOverview(@Query() query: FinanceOverviewReportQueryDto) {
    return this.reportsService.financeOverview(query);
  }

  @Get('finance/export')
  @RequirePermission('reports', 'VIEW')
  async exportFinanceOverview(
    @Query() query: ExportFinanceOverviewReportQueryDto,
  ) {
    const buffer = await this.reportsService.exportFinanceOverview(
      query,
      query.format,
    );
    return toFile(buffer, 'finance-report', query.format);
  }
}
