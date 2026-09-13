import { IsDateString } from 'class-validator';

export class HrReportQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;
}
