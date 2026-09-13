import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class ListUsersQueryDto extends PaginationQueryDto {
    search?: string;
    needsOnboarding?: string;
}
