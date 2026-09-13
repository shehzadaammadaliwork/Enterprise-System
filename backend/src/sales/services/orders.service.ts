import { HttpStatus, Injectable } from '@nestjs/common';
import {
  InvoiceStatus,
  OrderStatus,
  Prisma,
  type OrderItem,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto';
import { summarizeItems } from '../sales.util';

const ORDER_INCLUDE = {
  items: { orderBy: { createdAt: 'asc' as const } },
  invoice: { select: { id: true, number: true, status: true } },
};

/// Fulfillment pipeline: PENDING -> CONFIRMED -> FULFILLED, one stage at a
/// time. CANCELLED is allowed from PENDING or CONFIRMED but not from
/// FULFILLED (a completed order is done) — both FULFILLED and CANCELLED
/// are terminal.
const ORDER_SEQUENCE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.FULFILLED,
];

function isValidOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true;
  if (from === OrderStatus.CANCELLED || from === OrderStatus.FULFILLED)
    return false;
  if (to === OrderStatus.CANCELLED) return true;
  const fromIndex = ORDER_SEQUENCE.indexOf(from);
  const toIndex = ORDER_SEQUENCE.indexOf(to);
  return fromIndex !== -1 && toIndex === fromIndex + 1;
}

type OrderItemDecimalShape = Pick<
  OrderItem,
  'quantity' | 'unitPrice' | 'taxRatePercent' | 'lineTotal'
>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublicShape<T extends { items: OrderItemDecimalShape[] }>(
    order: T,
  ) {
    const items = order.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRatePercent: Number(item.taxRatePercent),
      lineTotal: Number(item.lineTotal),
    }));
    return { ...order, items, summary: summarizeItems(order.items) };
  }

  async listOrders(query: ListOrdersQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.OrderWhereInput = {
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.dealId && { dealId: query.dealId }),
      ...(query.status && { status: query.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      items: items.map((order) => this.toPublicShape(order)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order)
      throw new AppException(
        'ORDER_NOT_FOUND',
        'Order not found.',
        HttpStatus.NOT_FOUND,
      );
    return this.toPublicShape(order);
  }

  async updateOrder(id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { invoice: { select: { id: true, status: true } } },
    });
    if (!existing)
      throw new AppException(
        'ORDER_NOT_FOUND',
        'Order not found.',
        HttpStatus.NOT_FOUND,
      );
    if (!isValidOrderStatusTransition(existing.status, dto.status)) {
      throw new AppException(
        'ORDER_INVALID_STATUS_TRANSITION',
        `An order cannot move from ${existing.status} to ${dto.status} — orders must progress Pending → Confirmed → Fulfilled, or be Cancelled from Pending or Confirmed.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // Only a still-active invoice blocks cancellation — once it's been
    // Voided it no longer represents a real financial obligation tied to
    // this order, so the order becomes cancellable again.
    if (
      dto.status === OrderStatus.CANCELLED &&
      existing.invoice &&
      existing.invoice.status !== InvoiceStatus.VOID
    ) {
      throw new AppException(
        'ORDER_ALREADY_INVOICED',
        'This order already has an invoice — void the invoice instead of cancelling the order.',
        HttpStatus.CONFLICT,
      );
    }
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: ORDER_INCLUDE,
    });
    return this.toPublicShape(order);
  }
}
