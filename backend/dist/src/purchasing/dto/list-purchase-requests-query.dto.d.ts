import { PurchaseRequestCategory, PurchaseRequestStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListPurchaseRequestsQueryDto extends PaginationQueryDto {
    status?: PurchaseRequestStatus;
    category?: PurchaseRequestCategory;
}
