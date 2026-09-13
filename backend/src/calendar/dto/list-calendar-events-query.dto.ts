import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListCalendarEventsQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsOptional()
  @IsUUID('4')
  departmentId?: string;
}
