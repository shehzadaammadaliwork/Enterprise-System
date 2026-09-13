import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LeadSource } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  contactName!: string;

  /// class-validator's @IsOptional() only skips validation for null/
  /// undefined, not '' — the frontend form submits '' for a blank
  /// optional field, which would otherwise fail @IsEmail(). Normalize
  /// '' to undefined first so leaving email blank actually works.
  @Transform(({ value }: TransformFnParams) =>
    value === '' ? undefined : (value as string | undefined),
  )
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsUUID('4')
  assignedToUserId?: string;
}
