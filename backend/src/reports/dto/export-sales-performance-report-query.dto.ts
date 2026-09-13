import { IsIn } from 'class-validator';
import { SalesPerformanceReportQueryDto } from './sales-performance-report-query.dto';
import type { ReportExportFormat } from './report-export-format';

export class ExportSalesPerformanceReportQueryDto extends SalesPerformanceReportQueryDto {
  @IsIn(['pdf', 'excel'])
  format!: ReportExportFormat;
}
