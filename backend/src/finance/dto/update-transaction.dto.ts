import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/// `type` and `status` are deliberately absent — type is fixed at creation
/// (an income entry doesn't become an expense) and status only changes via
/// POST /finance/transactions/:id/approve|reject. See TransactionsService
/// for which combination of type/status actually allows an edit at all.
export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsUUID('4')
  bankAccountId?: string;
}
