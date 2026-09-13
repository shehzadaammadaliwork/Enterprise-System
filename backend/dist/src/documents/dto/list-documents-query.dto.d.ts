import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListDocumentsQueryDto extends PaginationQueryDto {
    entityType: string;
    entityId: string;
}
