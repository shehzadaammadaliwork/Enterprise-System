import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AssetCategory } from '@prisma/client';

/// Status and assignedEmployeeId are deliberately not here — they only
/// change through PATCH /assets/:id/status, which enforces the
/// transition matrix (see AssetsService.changeStatus).
export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
