/// Mirrors backend/src/common/pagination/pagination.dto.ts's PaginationMeta.
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
