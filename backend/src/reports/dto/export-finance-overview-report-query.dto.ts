import { IsIn } from 'class-validator';
import { FinanceOverviewReportQueryDto } from './finance-overview-report-query.dto';
import type { ReportExportFormat } from './report-export-format';

export class ExportFinanceOverviewReportQueryDto extends FinanceOverviewReportQueryDto {
  @IsIn(['pdf', 'excel'])
  format!: ReportExportFormat;
}
