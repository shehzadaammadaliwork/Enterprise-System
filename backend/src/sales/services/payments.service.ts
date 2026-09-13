import { HttpStatus, Injectable } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListPaymentsQueryDto } from '../dto/list-payments-query.dto';
import { InvoicesService } from './invoices.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  private toPublicShape<T extends { amount: Prisma.Decimal }>(payment: T) {
    return { ...payment, amount: Number(payment.amount) };
  }

  async listPayments(query: ListPaymentsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = { invoiceId: query.invoiceId };
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return {
      items: items.map((payment) => this.toPublicShape(payment)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async createPayment(dto: CreatePaymentDto, recordedByUserId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice)
      throw new AppException(
        'INVOICE_NOT_FOUND',
        'Invoice not found.',
        HttpStatus.NOT_FOUND,
      );
    if (invoice.status === InvoiceStatus.VOID) {
      throw new AppException(
        'INVOICE_VOID',
        'Cannot record a payment against a voided invoice.',
        HttpStatus.CONFLICT,
      );
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new AppException(
        'INVOICE_ALREADY_PAID',
        'This invoice is already fully paid.',
        HttpStatus.CONFLICT,
      );
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
          recordedByUserId,
        },
      });
      await this.invoicesService.recomputeStatus(tx, dto.invoiceId);
      return created;
    });

    return this.toPublicShape(payment);
  }

  /// Exported for DashboardService (Module 16) — "revenue" for the Sales
  /// summary widget: cash actually collected this calendar month (payments
  /// recorded, not invoices raised — same "actual money moved" framing as
  /// Finance's approved-transaction balance computation).
  async getRevenueThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const result = await this.prisma.payment.aggregate({
      where: { paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    return { revenueThisMonth: Number(result._sum.amount ?? 0) };
  }
}
