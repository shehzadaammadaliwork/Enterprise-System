import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class SalesPerformanceReportQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsOptional()
  @IsUUID('4')
  assignedToUserId?: string;
}
