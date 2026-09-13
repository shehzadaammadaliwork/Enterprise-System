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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async profitAndLoss(query) {
        const dateFrom = new Date(query.dateFrom);
        const dateTo = new Date(query.dateTo);
        const grouped = await this.prisma.transaction.groupBy({
            by: ['type', 'category'],
            where: {
                status: client_1.TransactionStatus.APPROVED,
                transactionDate: { gte: dateFrom, lte: dateTo },
                ...(query.bankAccountId && { bankAccountId: query.bankAccountId }),
            },
            _sum: { amount: true },
            orderBy: { category: 'asc' },
        });
        const byCategory = grouped.map((row) => ({
            type: row.type,
            category: row.category,
            total: Number(row._sum.amount ?? 0),
        }));
        const income = byCategory
            .filter((row) => row.type === client_1.TransactionType.INCOME)
            .reduce((sum, row) => sum + row.total, 0);
        const expenses = byCategory
            .filter((row) => row.type === client_1.TransactionType.EXPENSE)
            .reduce((sum, row) => sum + row.total, 0);
        return {
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            income,
            expenses,
            netProfit: income - expenses,
            byCategory,
        };
    }
    async cashFlow(query) {
        const dateFrom = new Date(query.dateFrom);
        const dateTo = new Date(query.dateTo);
        const accountWhere = query.bankAccountId
            ? { id: query.bankAccountId }
            : {};
        const [accounts, priorIncome, priorExpense, periodIncome, periodExpense] = await Promise.all([
            this.prisma.bankAccount.findMany({
                where: accountWhere,
                select: { openingBalance: true },
            }),
            this.sumTransactions(client_1.TransactionType.INCOME, query.bankAccountId, {
                lt: dateFrom,
            }),
            this.sumTransactions(client_1.TransactionType.EXPENSE, query.bankAccountId, {
                lt: dateFrom,
            }),
            this.sumTransactions(client_1.TransactionType.INCOME, query.bankAccountId, {
                gte: dateFrom,
                lte: dateTo,
            }),
            this.sumTransactions(client_1.TransactionType.EXPENSE, query.bankAccountId, {
                gte: dateFrom,
                lte: dateTo,
            }),
        ]);
        const accountsOpeningBalance = accounts.reduce((sum, a) => sum.plus(a.openingBalance), new client_1.Prisma.Decimal(0));
        const openingBalance = accountsOpeningBalance
            .plus(priorIncome)
            .minus(priorExpense);
        const totalInflow = periodIncome;
        const totalOutflow = periodExpense;
        const closingBalance = openingBalance.plus(totalInflow).minus(totalOutflow);
        return {
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            openingBalance: Number(openingBalance),
            totalInflow: Number(totalInflow),
            totalOutflow: Number(totalOutflow),
            closingBalance: Number(closingBalance),
        };
    }
    async sumTransactions(type, bankAccountId, transactionDate) {
        const result = await this.prisma.transaction.aggregate({
            where: {
                type,
                status: client_1.TransactionStatus.APPROVED,
                transactionDate,
                ...(bankAccountId && { bankAccountId }),
            },
            _sum: { amount: true },
        });
        return new client_1.Prisma.Decimal(result._sum.amount ?? 0);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map