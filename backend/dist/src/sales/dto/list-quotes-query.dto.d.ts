import { QuoteStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListQuotesQueryDto extends PaginationQueryDto {
    customerId?: string;
    dealId?: string;
    status?: QuoteStatus;
}
