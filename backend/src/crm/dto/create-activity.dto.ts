import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsUUID('4')
  customerId!: string;

  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsDateString()
  occurredAt!: string;
}
