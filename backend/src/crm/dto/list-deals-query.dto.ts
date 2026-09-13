import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DealStage } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListDealsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;
}
