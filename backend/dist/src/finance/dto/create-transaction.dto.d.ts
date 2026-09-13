import { TransactionType } from '@prisma/client';
export declare class CreateTransactionDto {
    type: TransactionType;
    category: string;
    amount: number;
    description?: string;
    transactionDate: string;
    bankAccountId: string;
}
