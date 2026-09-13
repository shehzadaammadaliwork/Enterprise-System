import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinanceReportQueryDto } from '../dto/finance-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /// Income and expense totals (and a per-category breakdown of each) for
  /// APPROVED transactions dated within [dateFrom, dateTo], optionally
  /// scoped to one bank account.
  async profitAndLoss(query: FinanceReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type', 'category'],
      where: {
        status: TransactionStatus.APPROVED,
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
      .filter((row) => row.type === TransactionType.INCOME)
      .reduce((sum, row) => sum + row.total, 0);
    const expenses = byCategory
      .filter((row) => row.type === TransactionType.EXPENSE)
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

  /// Opening balance as of the start of the range, total money in/out
  /// during the range, and the resulting closing balance. Opening balance
  /// = sum of each account's own openingBalance + every APPROVED
  /// transaction dated strictly before dateFrom (i.e. the same computation
  /// BankAccountsService does for "right now", just cut off earlier).
  async cashFlow(query: FinanceReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);
    const accountWhere: Prisma.BankAccountWhereInput = query.bankAccountId
      ? { id: query.bankAccountId }
      : {};

    const [accounts, priorIncome, priorExpense, periodIncome, periodExpense] =
      await Promise.all([
        this.prisma.bankAccount.findMany({
          where: accountWhere,
          select: { openingBalance: true },
        }),
        this.sumTransactions(TransactionType.INCOME, query.bankAccountId, {
          lt: dateFrom,
        }),
        this.sumTransactions(TransactionType.EXPENSE, query.bankAccountId, {
          lt: dateFrom,
        }),
        this.sumTransactions(TransactionType.INCOME, query.bankAccountId, {
          gte: dateFrom,
          lte: dateTo,
        }),
        this.sumTransactions(TransactionType.EXPENSE, query.bankAccountId, {
          gte: dateFrom,
          lte: dateTo,
        }),
      ]);

    const accountsOpeningBalance = accounts.reduce(
      (sum, a) => sum.plus(a.openingBalance),
      new Prisma.Decimal(0),
    );
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

  private async sumTransactions(
    type: TransactionType,
    bankAccountId: string | undefined,
    transactionDate: Prisma.DateTimeFilter,
  ): Promise<Prisma.Decimal> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        type,
        status: TransactionStatus.APPROVED,
        transactionDate,
        ...(bankAccountId && { bankAccountId }),
      },
      _sum: { amount: true },
    });
    return new Prisma.Decimal(result._sum.amount ?? 0);
  }
}
