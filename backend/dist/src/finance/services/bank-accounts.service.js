"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankAccountsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
let BankAccountsService = class BankAccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async computeBalance(accountId, openingBalance) {
        const [incomeSum, expenseSum] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: {
                    bankAccountId: accountId,
                    type: client_1.TransactionType.INCOME,
                    status: client_1.TransactionStatus.APPROVED,
                },
                _sum: { amount: true },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    bankAccountId: accountId,
                    type: client_1.TransactionType.EXPENSE,
                    status: client_1.TransactionStatus.APPROVED,
                },
                _sum: { amount: true },
            }),
        ]);
        return new client_1.Prisma.Decimal(openingBalance)
            .plus(incomeSum._sum.amount ?? 0)
            .minus(expenseSum._sum.amount ?? 0);
    }
    async toPublicShape(account) {
        const balance = await this.computeBalance(account.id, account.openingBalance);
        return {
            ...account,
            openingBalance: Number(account.openingBalance),
            balance: Number(balance),
        };
    }
    async listAccounts(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { bankName: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.bankAccount.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.bankAccount.count({ where }),
        ]);
        return {
            items: await Promise.all(items.map((account) => this.toPublicShape(account))),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getAccountOrThrow(id) {
        const account = await this.prisma.bankAccount.findUnique({ where: { id } });
        if (!account)
            throw new app_exception_1.AppException('BANK_ACCOUNT_NOT_FOUND', 'Bank account not found.', common_1.HttpStatus.NOT_FOUND);
        return account;
    }
    async getAccount(id) {
        return this.toPublicShape(await this.getAccountOrThrow(id));
    }
    async createAccount(dto) {
        const account = await this.prisma.bankAccount.create({
            data: { ...dto, openingBalance: dto.openingBalance ?? 0 },
        });
        return this.toPublicShape(account);
    }
    async updateAccount(id, dto) {
        await this.getAccountOrThrow(id);
        const account = await this.prisma.bankAccount.update({
            where: { id },
            data: dto,
        });
        return this.toPublicShape(account);
    }
    async deleteAccount(id) {
        await this.getAccountOrThrow(id);
        const transactionCount = await this.prisma.transaction.count({
            where: { bankAccountId: id },
        });
        if (transactionCount > 0) {
            throw new app_exception_1.AppException('BANK_ACCOUNT_IN_USE', 'This account has transactions recorded against it and cannot be deleted — deactivate it instead.', common_1.HttpStatus.CONFLICT);
        }
        await this.prisma.bankAccount.delete({ where: { id } });
    }
    async requireActiveAccount(id) {
        const account = await this.getAccountOrThrow(id);
        if (!account.isActive) {
            throw new app_exception_1.AppException('BANK_ACCOUNT_INACTIVE', 'This bank account is inactive and cannot receive new transactions.', common_1.HttpStatus.CONFLICT);
        }
        return account;
    }
    async getCashPosition() {
        const accounts = await this.prisma.bankAccount.findMany({
            where: { isActive: true },
        });
        const balances = await Promise.all(accounts.map((account) => this.computeBalance(account.id, account.openingBalance)));
        const cashPosition = balances.reduce((sum, balance) => sum.plus(balance), new client_1.Prisma.Decimal(0));
        return { cashPosition: Number(cashPosition.toDecimalPlaces(2)) };
    }
};
exports.BankAccountsService = BankAccountsService;
exports.BankAccountsService = BankAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankAccountsService);
//# sourceMappingURL=bank-accounts.service.js.map