import { ProductType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListProductsQueryDto extends PaginationQueryDto {
    type?: ProductType;
    search?: string;
}
