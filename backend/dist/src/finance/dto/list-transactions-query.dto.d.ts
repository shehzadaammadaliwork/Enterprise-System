import { TransactionStatus, TransactionType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListTransactionsQueryDto extends PaginationQueryDto {
    type?: TransactionType;
    status?: TransactionStatus;
    category?: string;
    bankAccountId?: string;
    dateFrom?: string;
    dateTo?: string;
}
