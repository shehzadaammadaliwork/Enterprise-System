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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const bank_accounts_service_1 = require("./bank-accounts.service");
let TransactionsService = class TransactionsService {
    prisma;
    bankAccountsService;
    constructor(prisma, bankAccountsService) {
        this.prisma = prisma;
        this.bankAccountsService = bankAccountsService;
    }
    toPublicShape(transaction) {
        return { ...transaction, amount: Number(transaction.amount) };
    }
    assertEditable(transaction) {
        if (transaction.type === client_1.TransactionType.EXPENSE &&
            transaction.status !== client_1.TransactionStatus.PENDING) {
            throw new app_exception_1.AppException('TRANSACTION_ALREADY_DECIDED', 'This expense has already been decided and can no longer be edited or deleted.', common_1.HttpStatus.CONFLICT);
        }
    }
    async listTransactions(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.type && { type: query.type }),
            ...(query.status && { status: query.status }),
            ...(query.category && {
                category: { equals: query.category, mode: 'insensitive' },
            }),
            ...(query.bankAccountId && { bankAccountId: query.bankAccountId }),
            ...((query.dateFrom || query.dateTo) && {
                transactionDate: {
                    ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
                    ...(query.dateTo && { lte: new Date(query.dateTo) }),
                },
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take,
                orderBy: { transactionDate: 'desc' },
                include: { bankAccount: { select: { id: true, name: true } } },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            items: items.map((t) => this.toPublicShape(t)),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getTransaction(id) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: { bankAccount: { select: { id: true, name: true } } },
        });
        if (!transaction)
            throw new app_exception_1.AppException('TRANSACTION_NOT_FOUND', 'Transaction not found.', common_1.HttpStatus.NOT_FOUND);
        return this.toPublicShape(transaction);
    }
    async createTransaction(dto, createdByUserId) {
        await this.bankAccountsService.requireActiveAccount(dto.bankAccountId);
        const transaction = await this.prisma.transaction.create({
            data: {
                type: dto.type,
                category: dto.category,
                amount: dto.amount,
                description: dto.description,
                transactionDate: new Date(dto.transactionDate),
                bankAccountId: dto.bankAccountId,
                createdByUserId,
                status: dto.type === client_1.TransactionType.INCOME
                    ? client_1.TransactionStatus.APPROVED
                    : client_1.TransactionStatus.PENDING,
            },
            include: { bankAccount: { select: { id: true, name: true } } },
        });
        return this.toPublicShape(transaction);
    }
    async createPreApprovedExpense(dto, createdByUserId, decidedByUserId) {
        await this.bankAccountsService.requireActiveAccount(dto.bankAccountId);
        const transaction = await this.prisma.transaction.create({
            data: {
                type: client_1.TransactionType.EXPENSE,
                category: dto.category,
                amount: dto.amount,
                description: dto.description,
                transactionDate: new Date(dto.transactionDate),
                bankAccountId: dto.bankAccountId,
                createdByUserId,
                status: client_1.TransactionStatus.APPROVED,
                decidedByUserId,
                decidedAt: new Date(),
            },
            include: { bankAccount: { select: { id: true, name: true } } },
        });
        return this.toPublicShape(transaction);
    }
    async updateTransaction(id, dto) {
        const existing = await this.prisma.transaction.findUnique({
            where: { id },
        });
        if (!existing)
            throw new app_exception_1.AppException('TRANSACTION_NOT_FOUND', 'Transaction not found.', common_1.HttpStatus.NOT_FOUND);
        this.assertEditable(existing);
        if (dto.bankAccountId)
            await this.bankAccountsService.requireActiveAccount(dto.bankAccountId);
        const transaction = await this.prisma.transaction.update({
            where: { id },
            data: {
                ...dto,
                transactionDate: dto.transactionDate
                    ? new Date(dto.transactionDate)
                    : undefined,
            },
            include: { bankAccount: { select: { id: true, name: true } } },
        });
        return this.toPublicShape(transaction);
    }
    async deleteTransaction(id) {
        const existing = await this.prisma.transaction.findUnique({
            where: { id },
        });
        if (!existing)
            throw new app_exception_1.AppException('TRANSACTION_NOT_FOUND', 'Transaction not found.', common_1.HttpStatus.NOT_FOUND);
        this.assertEditable(existing);
        await this.prisma.transaction.delete({ where: { id } });
    }
    async decide(id, decidedByUserId, approve) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
        });
        if (!transaction)
            throw new app_exception_1.AppException('TRANSACTION_NOT_FOUND', 'Transaction not found.', common_1.HttpStatus.NOT_FOUND);
        if (transaction.type !== client_1.TransactionType.EXPENSE) {
            throw new app_exception_1.AppException('TRANSACTION_NOT_APPROVABLE', 'Only expense transactions go through the approval workflow.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (transaction.status !== client_1.TransactionStatus.PENDING) {
            throw new app_exception_1.AppException('TRANSACTION_ALREADY_DECIDED', 'This expense has already been decided.', common_1.HttpStatus.CONFLICT);
        }
        const updated = await this.prisma.transaction.update({
            where: { id },
            data: {
                status: approve
                    ? client_1.TransactionStatus.APPROVED
                    : client_1.TransactionStatus.REJECTED,
                decidedByUserId,
                decidedAt: new Date(),
            },
            include: { bankAccount: { select: { id: true, name: true } } },
        });
        return this.toPublicShape(updated);
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bank_accounts_service_1.BankAccountsService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map