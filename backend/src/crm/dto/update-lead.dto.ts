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
import { LeadSource, LeadStatus } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  contactName?: string;

  /// See CreateLeadDto.email — '' must normalize to undefined before
  /// @IsOptional() sees it, or a blank field fails @IsEmail().
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

  /// CONVERTED is rejected here — that transition only happens via
  /// POST /crm/leads/:id/convert, which also creates the Customer.
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsUUID('4')
  assignedToUserId?: string;
}
