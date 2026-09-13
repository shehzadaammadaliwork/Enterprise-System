import { AssetCategory, AssetStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListAssetsQueryDto extends PaginationQueryDto {
    status?: AssetStatus;
    category?: AssetCategory;
    search?: string;
}
