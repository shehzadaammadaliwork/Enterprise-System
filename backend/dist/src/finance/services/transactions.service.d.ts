import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BankAccountsService } from './bank-accounts.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/list-transactions-query.dto';
export declare class TransactionsService {
    private readonly prisma;
    private readonly bankAccountsService;
    constructor(prisma: PrismaService, bankAccountsService: BankAccountsService);
    private toPublicShape;
    private assertEditable;
    listTransactions(query: ListTransactionsQueryDto): Promise<{
        items: ({
            bankAccount: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.TransactionType;
            status: import("@prisma/client").$Enums.TransactionStatus;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            createdByUserId: string;
            amount: Prisma.Decimal;
            bankAccountId: string;
            category: string;
            transactionDate: Date;
        } & {
            amount: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getTransaction(id: string): Promise<{
        bankAccount: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        createdByUserId: string;
        amount: Prisma.Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
    createTransaction(dto: CreateTransactionDto, createdByUserId: string): Promise<{
        bankAccount: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        createdByUserId: string;
        amount: Prisma.Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
    createPreApprovedExpense(dto: Omit<CreateTransactionDto, 'type'>, createdByUserId: string, decidedByUserId: string): Promise<{
        bankAccount: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        createdByUserId: string;
        amount: Prisma.Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
    updateTransaction(id: string, dto: UpdateTransactionDto): Promise<{
        bankAccount: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        createdByUserId: string;
        amount: Prisma.Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
    deleteTransaction(id: string): Promise<void>;
    decide(id: string, decidedByUserId: string, approve: boolean): Promise<{
        bankAccount: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        createdByUserId: string;
        amount: Prisma.Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
}
