import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { BankAccountsService } from './bank-accounts.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/list-transactions-query.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  private toPublicShape<T extends { amount: Prisma.Decimal }>(transaction: T) {
    return { ...transaction, amount: Number(transaction.amount) };
  }

  /// INCOME has no approval workflow (spec only asks for one on expenses)
  /// so it stays editable/deletable at any time; EXPENSE is only editable
  /// while still PENDING — once decided, it's a historical record of that
  /// decision, same immutability rule as LeaveRequest post-decision.
  private assertEditable(transaction: Transaction): void {
    if (
      transaction.type === TransactionType.EXPENSE &&
      transaction.status !== TransactionStatus.PENDING
    ) {
      throw new AppException(
        'TRANSACTION_ALREADY_DECIDED',
        'This expense has already been decided and can no longer be edited or deleted.',
        HttpStatus.CONFLICT,
      );
    }
  }

  async listTransactions(query: ListTransactionsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.TransactionWhereInput = {
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
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getTransaction(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { bankAccount: { select: { id: true, name: true } } },
    });
    if (!transaction)
      throw new AppException(
        'TRANSACTION_NOT_FOUND',
        'Transaction not found.',
        HttpStatus.NOT_FOUND,
      );
    return this.toPublicShape(transaction);
  }

  async createTransaction(dto: CreateTransactionDto, createdByUserId: string) {
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
        // INCOME skips the approval workflow entirely — see the model
        // comment on Transaction in schema.prisma.
        status:
          dto.type === TransactionType.INCOME
            ? TransactionStatus.APPROVED
            : TransactionStatus.PENDING,
      },
      include: { bankAccount: { select: { id: true, name: true } } },
    });
    return this.toPublicShape(transaction);
  }

  /// Used by PurchasingModule's PurchaseRequestsService when a Purchase
  /// Request is marked purchased. That expense already passed through the
  /// Purchase Request's own approval (and the purchase itself already
  /// happened) — routing it into this module's separate Pending queue
  /// would be a redundant, meaningless second approval on money that's
  /// already spent and can't be un-spent. Only expenses submitted
  /// directly in Finance (createTransaction, no prior Procurement
  /// approval behind them) go through that Pending workflow.
  async createPreApprovedExpense(
    dto: Omit<CreateTransactionDto, 'type'>,
    createdByUserId: string,
    decidedByUserId: string,
  ) {
    await this.bankAccountsService.requireActiveAccount(dto.bankAccountId);
    const transaction = await this.prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        transactionDate: new Date(dto.transactionDate),
        bankAccountId: dto.bankAccountId,
        createdByUserId,
        status: TransactionStatus.APPROVED,
        decidedByUserId,
        decidedAt: new Date(),
      },
      include: { bankAccount: { select: { id: true, name: true } } },
    });
    return this.toPublicShape(transaction);
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!existing)
      throw new AppException(
        'TRANSACTION_NOT_FOUND',
        'Transaction not found.',
        HttpStatus.NOT_FOUND,
      );
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

  async deleteTransaction(id: string): Promise<void> {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!existing)
      throw new AppException(
        'TRANSACTION_NOT_FOUND',
        'Transaction not found.',
        HttpStatus.NOT_FOUND,
      );
    this.assertEditable(existing);
    await this.prisma.transaction.delete({ where: { id } });
  }

  /// POST /finance/transactions/:id/approve|reject — EXPENSE only, and
  /// only while PENDING (mirrors LeaveService.decide() from Module 5).
  async decide(id: string, decidedByUserId: string, approve: boolean) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction)
      throw new AppException(
        'TRANSACTION_NOT_FOUND',
        'Transaction not found.',
        HttpStatus.NOT_FOUND,
      );
    if (transaction.type !== TransactionType.EXPENSE) {
      throw new AppException(
        'TRANSACTION_NOT_APPROVABLE',
        'Only expense transactions go through the approval workflow.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new AppException(
        'TRANSACTION_ALREADY_DECIDED',
        'This expense has already been decided.',
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: approve
          ? TransactionStatus.APPROVED
          : TransactionStatus.REJECTED,
        decidedByUserId,
        decidedAt: new Date(),
      },
      include: { bankAccount: { select: { id: true, name: true } } },
    });
    return this.toPublicShape(updated);
  }
}
