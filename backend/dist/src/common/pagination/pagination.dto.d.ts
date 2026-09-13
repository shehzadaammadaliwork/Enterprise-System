export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginatedResult<T> {
    items: T[];
    meta: PaginationMeta;
}
export declare function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta;
export declare function paginationSkipTake(query: PaginationQueryDto): {
    skip: number;
    take: number;
    page: number;
    limit: number;
};
