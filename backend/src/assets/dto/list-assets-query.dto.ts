import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AssetCategory, AssetStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListAssetsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
