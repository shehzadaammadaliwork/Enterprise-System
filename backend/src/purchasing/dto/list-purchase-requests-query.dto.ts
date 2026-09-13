import { IsEnum, IsOptional } from 'class-validator';
import { PurchaseRequestCategory, PurchaseRequestStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListPurchaseRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PurchaseRequestStatus)
  status?: PurchaseRequestStatus;

  @IsOptional()
  @IsEnum(PurchaseRequestCategory)
  category?: PurchaseRequestCategory;
}
