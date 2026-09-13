import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/// openingBalance is intentionally not editable here — it's a snapshot of
/// the account's balance at the moment it was added to this system, and
/// changing it after transactions exist would quietly rewrite history that
/// the computed balance (openingBalance + approved transactions) depends
/// on. Correct a mistake with an adjusting Transaction instead.
export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  accountNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
