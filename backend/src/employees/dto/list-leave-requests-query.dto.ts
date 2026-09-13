import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { LeaveStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListLeaveRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsUUID('4')
  employeeId?: string;
}
