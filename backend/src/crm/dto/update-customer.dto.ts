import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCustomerDto {
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

  /// See CreateCustomerDto.email — '' must normalize to undefined before
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
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
