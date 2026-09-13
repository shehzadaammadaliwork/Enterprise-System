import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListPayrollAdjustmentsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  /// Comma-separated employee ids — kept as a single string param rather
  /// than a repeated one so this DTO passes the global ValidationPipe's
  /// `whitelist: true` check on the raw query object (see CLAUDE.md's list
  /// filter gotcha). Split in the service.
  @IsOptional()
  @IsString()
  employeeIds?: string;
}
