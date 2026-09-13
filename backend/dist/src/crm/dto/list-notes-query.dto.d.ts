import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListNotesQueryDto extends PaginationQueryDto {
    leadId?: string;
    customerId?: string;
    dealId?: string;
}
