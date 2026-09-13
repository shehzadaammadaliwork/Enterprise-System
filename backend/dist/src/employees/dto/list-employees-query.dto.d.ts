import { EmploymentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListEmployeesQueryDto extends PaginationQueryDto {
    departmentId?: string;
    status?: EmploymentStatus;
}
