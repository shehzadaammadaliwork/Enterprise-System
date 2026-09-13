import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BankAccount,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { UpdateBankAccountDto } from '../dto/update-bank-account.dto';
import { ListBankAccountsQueryDto } from '../dto/list-bank-accounts-query.dto';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /// Balance is never stored — always openingBalance + approved income -
  /// approved expense, computed fresh (same pattern as
  /// Invoice.outstandingBalance in Module 9).
  private async computeBalance(
    accountId: string,
    openingBalance: Prisma.Decimal,
  ): Promise<Prisma.Decimal> {
    const [incomeSum, expenseSum] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          bankAccountId: accountId,
          type: TransactionType.INCOME,
          status: TransactionStatus.APPROVED,
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          bankAccountId: accountId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.APPROVED,
        },
        _sum: { amount: true },
      }),
    ]);
    return new Prisma.Decimal(openingBalance)
      .plus(incomeSum._sum.amount ?? 0)
      .minus(expenseSum._sum.amount ?? 0);
  }

  private async toPublicShape(account: BankAccount) {
    const balance = await this.computeBalance(
      account.id,
      account.openingBalance,
    );
    return {
      ...account,
      openingBalance: Number(account.openingBalance),
      balance: Number(balance),
    };
  }

  async listAccounts(query: ListBankAccountsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.BankAccountWhereInput = {
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
      items: await Promise.all(
        items.map((account) => this.toPublicShape(account)),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async getAccountOrThrow(id: string): Promise<BankAccount> {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account)
      throw new AppException(
        'BANK_ACCOUNT_NOT_FOUND',
        'Bank account not found.',
        HttpStatus.NOT_FOUND,
      );
    return account;
  }

  async getAccount(id: string) {
    return this.toPublicShape(await this.getAccountOrThrow(id));
  }

  async createAccount(dto: CreateBankAccountDto) {
    const account = await this.prisma.bankAccount.create({
      data: { ...dto, openingBalance: dto.openingBalance ?? 0 },
    });
    return this.toPublicShape(account);
  }

  async updateAccount(id: string, dto: UpdateBankAccountDto) {
    await this.getAccountOrThrow(id);
    const account = await this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });
    return this.toPublicShape(account);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.getAccountOrThrow(id);
    const transactionCount = await this.prisma.transaction.count({
      where: { bankAccountId: id },
    });
    if (transactionCount > 0) {
      throw new AppException(
        'BANK_ACCOUNT_IN_USE',
        'This account has transactions recorded against it and cannot be deleted — deactivate it instead.',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.bankAccount.delete({ where: { id } });
  }

  /// Used by TransactionsService to validate a referenced account exists
  /// (and is active) without pulling in the balance computation.
  async requireActiveAccount(id: string): Promise<BankAccount> {
    const account = await this.getAccountOrThrow(id);
    if (!account.isActive) {
      throw new AppException(
        'BANK_ACCOUNT_INACTIVE',
        'This bank account is inactive and cannot receive new transactions.',
        HttpStatus.CONFLICT,
      );
    }
    return account;
  }

  /// Exported for DashboardService (Module 16) — "cash position" for the
  /// Finance summary widget: sum of every active account's own live-computed
  /// balance (same computeBalance this module's own list/detail endpoints use).
  async getCashPosition() {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { isActive: true },
    });
    const balances = await Promise.all(
      accounts.map((account) =>
        this.computeBalance(account.id, account.openingBalance),
      ),
    );
    const cashPosition = balances.reduce(
      (sum, balance) => sum.plus(balance),
      new Prisma.Decimal(0),
    );
    return { cashPosition: Number(cashPosition.toDecimalPlaces(2)) };
  }
}
