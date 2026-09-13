import {
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PurchaseRequestCategory } from '@prisma/client';

export class CreatePurchaseRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @IsEnum(PurchaseRequestCategory)
  category!: PurchaseRequestCategory;

  @IsNumber()
  @Min(0.01)
  estimatedCost!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;
}
