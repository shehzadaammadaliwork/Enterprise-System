import { TransactionsService } from '../services/transactions.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/list-transactions-query.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
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
            amount: import("@prisma/client/runtime/library").Decimal;
            bankAccountId: string;
            category: string;
            transactionDate: Date;
        } & {
            amount: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createTransaction(user: AuthenticatedUser, dto: CreateTransactionDto): Promise<{
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
        amount: import("@prisma/client/runtime/library").Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
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
        amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
    deleteTransaction(id: string): Promise<void>;
    approve(id: string, user: AuthenticatedUser): Promise<{
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
        amount: import("@prisma/client/runtime/library").Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
    reject(id: string, user: AuthenticatedUser): Promise<{
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
        amount: import("@prisma/client/runtime/library").Decimal;
        bankAccountId: string;
        category: string;
        transactionDate: Date;
    } & {
        amount: number;
    }>;
}
