import { AuditAction } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  userEmail?: string;

  /// Not restricted to the canonical MODULES slug list: the audit
  /// interceptor derives this from the request path's first segment
  /// (see AuditLogInterceptor), which is finer-grained than the RBAC
  /// module list — e.g. "leave-requests"/"attendance" are distinct audit
  /// `module` values under the single "employees" RBAC slug.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
