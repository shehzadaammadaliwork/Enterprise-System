import { OrderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListOrdersQueryDto extends PaginationQueryDto {
    customerId?: string;
    dealId?: string;
    status?: OrderStatus;
}
