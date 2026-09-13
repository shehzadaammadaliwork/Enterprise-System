import { LeadStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListLeadsQueryDto extends PaginationQueryDto {
    status?: LeadStatus;
    search?: string;
}
