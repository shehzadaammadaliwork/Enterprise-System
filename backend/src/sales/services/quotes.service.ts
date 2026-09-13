import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  QuoteStatus,
  type Product,
  type QuoteItem,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CustomersService } from '../../crm/services/customers.service';
import { DealsService } from '../../crm/services/deals.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { ListQuotesQueryDto } from '../dto/list-quotes-query.dto';
import { QuoteItemInputDto } from '../dto/quote-item-input.dto';
import { computeLineTotal, summarizeItems } from '../sales.util';

const QUOTE_INCLUDE = { items: { orderBy: { createdAt: 'asc' as const } } };

/// Quote status flow (CONVERTED is out of band — see convertQuote below,
/// never settable through updateQuote): DRAFT -> SENT -> ACCEPTED, with
/// SENT also able to drop to REJECTED or EXPIRED. ACCEPTED/REJECTED/
/// EXPIRED are terminal via this update path.
function isValidQuoteStatusTransition(
  from: QuoteStatus,
  to: QuoteStatus,
): boolean {
  if (from === to) return true;
  if (from === QuoteStatus.DRAFT) return to === QuoteStatus.SENT;
  if (from === QuoteStatus.SENT) {
    return (
      to === QuoteStatus.ACCEPTED ||
      to === QuoteStatus.REJECTED ||
      to === QuoteStatus.EXPIRED
    );
  }
  return false;
}

/// A quote can only be converted to an order once a customer has actually
/// seen it — Draft is too early (see isValidQuoteStatusTransition above).
const CONVERTIBLE_QUOTE_STATUSES: QuoteStatus[] = [
  QuoteStatus.SENT,
  QuoteStatus.ACCEPTED,
];

type QuoteItemDecimalShape = Pick<
  QuoteItem,
  'quantity' | 'unitPrice' | 'taxRatePercent' | 'lineTotal'
>;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly dealsService: DealsService,
  ) {}

  /// Validates a dealId reference on create/update — the deal must exist,
  /// and (to keep the link meaningful) must belong to the same customer as
  /// the quote. DealsService.getDeal throws DEAL_NOT_FOUND on its own; the
  /// customer-mismatch check is this service's own guard.
  private async requireDealMatchesCustomer(
    dealId: string,
    customerId: string,
  ): Promise<void> {
    const deal = await this.dealsService.getDeal(dealId);
    if (deal.customerId !== customerId) {
      throw new AppException(
        'DEAL_CUSTOMER_MISMATCH',
        'The selected deal belongs to a different customer than this quote.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private itemToPublicShape<T extends QuoteItemDecimalShape>(item: T) {
    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRatePercent: Number(item.taxRatePercent),
      lineTotal: Number(item.lineTotal),
    };
  }

  private toPublicShape<T extends { items: QuoteItemDecimalShape[] }>(
    quote: T,
  ) {
    const items = quote.items.map((item) => this.itemToPublicShape(item));
    return { ...quote, items, summary: summarizeItems(quote.items) };
  }

  /// Looks up every referenced Product (to validate it exists and to
  /// snapshot its current name as the line's description — see QuoteItem's
  /// schema comment) and builds the priced-line-item data to persist. The
  /// catalog carries no pricing at all, so unitPrice/taxRatePercent always
  /// come straight from the client input, never a catalog default.
  private async buildItemsData(inputs: QuoteItemInputDto[]) {
    const productIds = [...new Set(inputs.map((input) => input.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productsById = new Map<string, Product>(
      products.map((product) => [product.id, product]),
    );

    return inputs.map((input) => {
      const product = productsById.get(input.productId);
      if (!product) {
        throw new AppException(
          'PRODUCT_NOT_FOUND',
          `Product ${input.productId} not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
      const lineTotal = computeLineTotal(
        input.quantity,
        input.unitPrice,
        input.taxRatePercent,
      );
      return {
        productId: product.id,
        description: product.name,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        taxRatePercent: input.taxRatePercent,
        lineTotal,
      };
    });
  }

  async listQuotes(query: ListQuotesQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.QuoteWhereInput = {
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.dealId && { dealId: query.dealId }),
      ...(query.status && { status: query.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: QUOTE_INCLUDE,
      }),
      this.prisma.quote.count({ where }),
    ]);
    return {
      items: items.map((quote) => this.toPublicShape(quote)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getQuote(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_INCLUDE,
    });
    if (!quote)
      throw new AppException(
        'QUOTE_NOT_FOUND',
        'Quote not found.',
        HttpStatus.NOT_FOUND,
      );
    return this.toPublicShape(quote);
  }

  async createQuote(dto: CreateQuoteDto, createdByUserId: string) {
    await this.customersService.getCustomer(dto.customerId);
    if (dto.dealId) {
      await this.requireDealMatchesCustomer(dto.dealId, dto.customerId);
    }
    const itemsData = await this.buildItemsData(dto.items);

    const quote = await this.prisma.quote.create({
      data: {
        customerId: dto.customerId,
        dealId: dto.dealId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        createdByUserId,
        items: { create: itemsData },
      },
      include: QUOTE_INCLUDE,
    });
    return this.toPublicShape(quote);
  }

  async updateQuote(id: string, dto: UpdateQuoteDto) {
    const existing = await this.prisma.quote.findUnique({ where: { id } });
    if (!existing)
      throw new AppException(
        'QUOTE_NOT_FOUND',
        'Quote not found.',
        HttpStatus.NOT_FOUND,
      );
    if (existing.status === QuoteStatus.CONVERTED) {
      throw new AppException(
        'QUOTE_ALREADY_CONVERTED',
        'A converted quote cannot be edited.',
        HttpStatus.CONFLICT,
      );
    }
    if (dto.status === QuoteStatus.CONVERTED) {
      throw new AppException(
        'QUOTE_STATUS_CONVERTED_NOT_ALLOWED',
        'A quote can only reach CONVERTED status via POST /sales/quotes/:id/convert.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      dto.status &&
      !isValidQuoteStatusTransition(existing.status, dto.status)
    ) {
      throw new AppException(
        'QUOTE_INVALID_STATUS_TRANSITION',
        `A quote cannot move from ${existing.status} to ${dto.status} — quotes must progress Draft → Sent → Accepted/Rejected/Expired.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // Line items are only ever freely editable while a quote is still
    // Draft — once it's been Sent, the customer already has a copy of it,
    // so a price/quantity change has to go through Reject + a fresh quote,
    // not a silent edit. Enforced here, not just hidden in the UI, so a
    // direct API call can't bypass it either.
    if (dto.items && existing.status !== QuoteStatus.DRAFT) {
      throw new AppException(
        'QUOTE_ITEMS_LOCKED',
        'Line items can only be edited while a quote is Draft — reject this quote and create a new one instead.',
        HttpStatus.CONFLICT,
      );
    }
    if (dto.dealId) {
      await this.requireDealMatchesCustomer(dto.dealId, existing.customerId);
    }

    const itemsData = dto.items
      ? await this.buildItemsData(dto.items)
      : undefined;

    const quote = await this.prisma.$transaction(async (tx) => {
      if (itemsData) await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      return tx.quote.update({
        where: { id },
        data: {
          dealId: dto.dealId,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          notes: dto.notes,
          status: dto.status,
          ...(itemsData && { items: { create: itemsData } }),
        },
        include: QUOTE_INCLUDE,
      });
    });

    // Deal.value tracks an estimate until a quote is actually Accepted —
    // only the transition INTO Accepted (never create/send/reject, and
    // never a redundant re-save of an already-Accepted quote) overwrites
    // it with the real negotiated total, per this quote's own line items.
    if (
      dto.status === QuoteStatus.ACCEPTED &&
      existing.status !== QuoteStatus.ACCEPTED &&
      quote.dealId
    ) {
      const { total } = summarizeItems(quote.items);
      await this.dealsService.updateDeal(quote.dealId, { value: total });
    }

    return this.toPublicShape(quote);
  }

  async deleteQuote(id: string): Promise<void> {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote)
      throw new AppException(
        'QUOTE_NOT_FOUND',
        'Quote not found.',
        HttpStatus.NOT_FOUND,
      );
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new AppException(
        'QUOTE_ALREADY_CONVERTED',
        'A converted quote cannot be deleted.',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.quote.delete({ where: { id } });
  }

  async convertQuote(id: string, createdByUserId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_INCLUDE,
    });
    if (!quote)
      throw new AppException(
        'QUOTE_NOT_FOUND',
        'Quote not found.',
        HttpStatus.NOT_FOUND,
      );
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new AppException(
        'QUOTE_ALREADY_CONVERTED',
        'This quote has already been converted to an order.',
        HttpStatus.CONFLICT,
      );
    }
    if (!CONVERTIBLE_QUOTE_STATUSES.includes(quote.status)) {
      throw new AppException(
        'QUOTE_NOT_CONVERTIBLE',
        'Send the quote before converting it to an order.',
        HttpStatus.CONFLICT,
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId: quote.customerId,
          dealId: quote.dealId,
          createdByUserId,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRatePercent: item.taxRatePercent,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });
      await tx.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.CONVERTED,
          convertedToOrderId: createdOrder.id,
        },
      });
      return createdOrder;
    });

    return {
      quote: this.toPublicShape({
        ...quote,
        status: QuoteStatus.CONVERTED,
        convertedToOrderId: order.id,
      }),
      order: {
        ...order,
        items: order.items.map((item) => this.itemToPublicShape(item)),
      },
    };
  }
}
