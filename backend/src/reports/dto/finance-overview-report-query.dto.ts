import { IsDateString } from 'class-validator';

export class FinanceOverviewReportQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;
}
