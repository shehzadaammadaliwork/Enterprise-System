import { LeaveStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListLeaveRequestsQueryDto extends PaginationQueryDto {
    status?: LeaveStatus;
    employeeId?: string;
}
