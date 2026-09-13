import { HttpStatus, Injectable } from '@nestjs/common';
import {
  InvoiceStatus,
  OrderStatus,
  Prisma,
  type Payment,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { ListInvoicesQueryDto } from '../dto/list-invoices-query.dto';
import { summarizeItems } from '../sales.util';

const INVOICE_INCLUDE = {
  payments: { orderBy: { paidAt: 'asc' as const } },
  order: { include: { items: { orderBy: { createdAt: 'asc' as const } } } },
};

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublicShape<
    T extends {
      totalAmount: Prisma.Decimal;
      payments: Pick<Payment, 'amount'>[];
    },
  >(invoice: T) {
    const paid = invoice.payments.reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Prisma.Decimal(0),
    );
    return {
      ...invoice,
      totalAmount: Number(invoice.totalAmount),
      amountPaid: Number(paid.toDecimalPlaces(2)),
      outstandingBalance: Number(
        new Prisma.Decimal(invoice.totalAmount).minus(paid).toDecimalPlaces(2),
      ),
    };
  }

  async listInvoices(query: ListInvoicesQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.InvoiceWhereInput = {
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.status && { status: query.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: INVOICE_INCLUDE,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return {
      items: items.map((invoice) => this.toPublicShape(invoice)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice)
      throw new AppException(
        'INVOICE_NOT_FOUND',
        'Invoice not found.',
        HttpStatus.NOT_FOUND,
      );
    return {
      ...this.toPublicShape(invoice),
      order: {
        ...invoice.order,
        items: invoice.order.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRatePercent: Number(item.taxRatePercent),
          lineTotal: Number(item.lineTotal),
        })),
        summary: summarizeItems(invoice.order.items),
      },
    };
  }

  /// POST /sales/orders/:id/invoice — one invoice per order (see Invoice's
  /// schema comment for the scope note). Not exposed as a standalone
  /// "create invoice" endpoint since an invoice always originates from an
  /// order's own line items.
  async generateFromOrder(orderId: string, createdByUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, invoice: { select: { id: true } } },
    });
    if (!order)
      throw new AppException(
        'ORDER_NOT_FOUND',
        'Order not found.',
        HttpStatus.NOT_FOUND,
      );
    if (order.status === OrderStatus.CANCELLED) {
      throw new AppException(
        'ORDER_CANCELLED',
        'A cancelled order cannot be invoiced.',
        HttpStatus.CONFLICT,
      );
    }
    if (order.invoice) {
      throw new AppException(
        'ORDER_ALREADY_INVOICED',
        'This order has already been invoiced.',
        HttpStatus.CONFLICT,
      );
    }

    const { total } = summarizeItems(order.items);
    const invoice = await this.prisma.invoice.create({
      data: {
        orderId,
        customerId: order.customerId,
        totalAmount: total,
        createdByUserId,
      },
      include: INVOICE_INCLUDE,
    });
    return this.getInvoice(invoice.id);
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto) {
    await this.requireNotVoid(id);
    await this.prisma.invoice.update({
      where: { id },
      data: { dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
    return this.getInvoice(id);
  }

  private async requireNotVoid(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice)
      throw new AppException(
        'INVOICE_NOT_FOUND',
        'Invoice not found.',
        HttpStatus.NOT_FOUND,
      );
    if (invoice.status === InvoiceStatus.VOID) {
      throw new AppException(
        'INVOICE_VOID',
        'A voided invoice cannot be modified.',
        HttpStatus.CONFLICT,
      );
    }
    return invoice;
  }

  async voidInvoice(id: string) {
    await this.requireNotVoid(id);
    await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID },
    });
    return this.getInvoice(id);
  }

  /// Recomputes UNPAID/PARTIALLY_PAID/PAID from the sum of recorded
  /// Payments — called by PaymentsService inside the same transaction
  /// that creates a new Payment. A VOID invoice is left untouched.
  async recomputeStatus(
    tx: Prisma.TransactionClient,
    invoiceId: string,
  ): Promise<void> {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (invoice.status === InvoiceStatus.VOID) return;

    const paid = invoice.payments.reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Prisma.Decimal(0),
    );
    const status = paid.greaterThanOrEqualTo(invoice.totalAmount)
      ? InvoiceStatus.PAID
      : paid.greaterThan(0)
        ? InvoiceStatus.PARTIALLY_PAID
        : InvoiceStatus.UNPAID;

    await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
  }

  /// Exported for DashboardService (Module 16) — "invoices" for the
  /// Finance summary widget (spec groups it there, even though Invoice
  /// itself is owned by Sales): outstanding = UNPAID or PARTIALLY_PAID,
  /// excluding VOID and fully PAID.
  async getOutstandingSummary() {
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID],
        },
      },
      include: { payments: true },
    });
    const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => {
      const paid = invoice.payments.reduce(
        (paidSum, payment) => paidSum.plus(payment.amount),
        new Prisma.Decimal(0),
      );
      return sum.plus(new Prisma.Decimal(invoice.totalAmount).minus(paid));
    }, new Prisma.Decimal(0));
    return {
      outstandingInvoicesCount: outstandingInvoices.length,
      outstandingInvoicesTotal: Number(outstandingTotal.toDecimalPlaces(2)),
    };
  }
}
