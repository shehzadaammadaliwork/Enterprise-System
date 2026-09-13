import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class FinanceReportQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsOptional()
  @IsUUID('4')
  bankAccountId?: string;
}
