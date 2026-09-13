import { BankAccount } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { UpdateBankAccountDto } from '../dto/update-bank-account.dto';
import { ListBankAccountsQueryDto } from '../dto/list-bank-accounts-query.dto';
export declare class BankAccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private computeBalance;
    private toPublicShape;
    listAccounts(query: ListBankAccountsQueryDto): Promise<{
        items: {
            openingBalance: number;
            balance: number;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            bankName: string | null;
            accountNumber: string | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    private getAccountOrThrow;
    getAccount(id: string): Promise<{
        openingBalance: number;
        balance: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string | null;
        accountNumber: string | null;
    }>;
    createAccount(dto: CreateBankAccountDto): Promise<{
        openingBalance: number;
        balance: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string | null;
        accountNumber: string | null;
    }>;
    updateAccount(id: string, dto: UpdateBankAccountDto): Promise<{
        openingBalance: number;
        balance: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string | null;
        accountNumber: string | null;
    }>;
    deleteAccount(id: string): Promise<void>;
    requireActiveAccount(id: string): Promise<BankAccount>;
    getCashPosition(): Promise<{
        cashPosition: number;
    }>;
}
