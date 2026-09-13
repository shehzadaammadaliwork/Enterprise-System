import { AuditAction } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListAuditLogsQueryDto extends PaginationQueryDto {
    userEmail?: string;
    module?: string;
    action?: AuditAction;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
}
