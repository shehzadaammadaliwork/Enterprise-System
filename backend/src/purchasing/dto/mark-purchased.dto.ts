import { IsNumber, IsUUID, Min } from 'class-validator';

/// A bank account is required here because Finance's Transaction.bankAccountId
/// is not nullable — the person completing the purchase picks which account
/// it was actually paid from, same as recording any other expense.
export class MarkPurchasedDto {
  @IsNumber()
  @Min(0.01)
  actualAmount!: number;

  @IsUUID('4')
  bankAccountId!: string;
}
