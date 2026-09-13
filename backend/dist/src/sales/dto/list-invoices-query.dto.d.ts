import { InvoiceStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListInvoicesQueryDto extends PaginationQueryDto {
    customerId?: string;
    status?: InvoiceStatus;
}
