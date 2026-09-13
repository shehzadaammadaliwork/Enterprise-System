import { IsIn } from 'class-validator';
import { HrReportQueryDto } from './hr-report-query.dto';
import type { ReportExportFormat } from './report-export-format';

export class ExportHrReportQueryDto extends HrReportQueryDto {
  @IsIn(['pdf', 'excel'])
  format!: ReportExportFormat;
}
