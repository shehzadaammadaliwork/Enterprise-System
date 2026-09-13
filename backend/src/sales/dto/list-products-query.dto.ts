import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProductType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
