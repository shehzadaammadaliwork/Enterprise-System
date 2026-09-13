import { DealStage } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListDealsQueryDto extends PaginationQueryDto {
    customerId?: string;
    stage?: DealStage;
}
