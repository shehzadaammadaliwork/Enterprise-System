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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const customers_service_1 = require("../../crm/services/customers.service");
const deals_service_1 = require("../../crm/services/deals.service");
const sales_util_1 = require("../sales.util");
const QUOTE_INCLUDE = { items: { orderBy: { createdAt: 'asc' } } };
function isValidQuoteStatusTransition(from, to) {
    if (from === to)
        return true;
    if (from === client_1.QuoteStatus.DRAFT)
        return to === client_1.QuoteStatus.SENT;
    if (from === client_1.QuoteStatus.SENT) {
        return (to === client_1.QuoteStatus.ACCEPTED ||
            to === client_1.QuoteStatus.REJECTED ||
            to === client_1.QuoteStatus.EXPIRED);
    }
    return false;
}
const CONVERTIBLE_QUOTE_STATUSES = [
    client_1.QuoteStatus.SENT,
    client_1.QuoteStatus.ACCEPTED,
];
let QuotesService = class QuotesService {
    prisma;
    customersService;
    dealsService;
    constructor(prisma, customersService, dealsService) {
        this.prisma = prisma;
        this.customersService = customersService;
        this.dealsService = dealsService;
    }
    async requireDealMatchesCustomer(dealId, customerId) {
        const deal = await this.dealsService.getDeal(dealId);
        if (deal.customerId !== customerId) {
            throw new app_exception_1.AppException('DEAL_CUSTOMER_MISMATCH', 'The selected deal belongs to a different customer than this quote.', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    itemToPublicShape(item) {
        return {
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRatePercent: Number(item.taxRatePercent),
            lineTotal: Number(item.lineTotal),
        };
    }
    toPublicShape(quote) {
        const items = quote.items.map((item) => this.itemToPublicShape(item));
        return { ...quote, items, summary: (0, sales_util_1.summarizeItems)(quote.items) };
    }
    async buildItemsData(inputs) {
        const productIds = [...new Set(inputs.map((input) => input.productId))];
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));
        return inputs.map((input) => {
            const product = productsById.get(input.productId);
            if (!product) {
                throw new app_exception_1.AppException('PRODUCT_NOT_FOUND', `Product ${input.productId} not found.`, common_1.HttpStatus.NOT_FOUND);
            }
            const lineTotal = (0, sales_util_1.computeLineTotal)(input.quantity, input.unitPrice, input.taxRatePercent);
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
    async listQuotes(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getQuote(id) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: QUOTE_INCLUDE,
        });
        if (!quote)
            throw new app_exception_1.AppException('QUOTE_NOT_FOUND', 'Quote not found.', common_1.HttpStatus.NOT_FOUND);
        return this.toPublicShape(quote);
    }
    async createQuote(dto, createdByUserId) {
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
    async updateQuote(id, dto) {
        const existing = await this.prisma.quote.findUnique({ where: { id } });
        if (!existing)
            throw new app_exception_1.AppException('QUOTE_NOT_FOUND', 'Quote not found.', common_1.HttpStatus.NOT_FOUND);
        if (existing.status === client_1.QuoteStatus.CONVERTED) {
            throw new app_exception_1.AppException('QUOTE_ALREADY_CONVERTED', 'A converted quote cannot be edited.', common_1.HttpStatus.CONFLICT);
        }
        if (dto.status === client_1.QuoteStatus.CONVERTED) {
            throw new app_exception_1.AppException('QUOTE_STATUS_CONVERTED_NOT_ALLOWED', 'A quote can only reach CONVERTED status via POST /sales/quotes/:id/convert.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.status &&
            !isValidQuoteStatusTransition(existing.status, dto.status)) {
            throw new app_exception_1.AppException('QUOTE_INVALID_STATUS_TRANSITION', `A quote cannot move from ${existing.status} to ${dto.status} — quotes must progress Draft → Sent → Accepted/Rejected/Expired.`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.items && existing.status !== client_1.QuoteStatus.DRAFT) {
            throw new app_exception_1.AppException('QUOTE_ITEMS_LOCKED', 'Line items can only be edited while a quote is Draft — reject this quote and create a new one instead.', common_1.HttpStatus.CONFLICT);
        }
        if (dto.dealId) {
            await this.requireDealMatchesCustomer(dto.dealId, existing.customerId);
        }
        const itemsData = dto.items
            ? await this.buildItemsData(dto.items)
            : undefined;
        const quote = await this.prisma.$transaction(async (tx) => {
            if (itemsData)
                await tx.quoteItem.deleteMany({ where: { quoteId: id } });
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
        if (dto.status === client_1.QuoteStatus.ACCEPTED &&
            existing.status !== client_1.QuoteStatus.ACCEPTED &&
            quote.dealId) {
            const { total } = (0, sales_util_1.summarizeItems)(quote.items);
            await this.dealsService.updateDeal(quote.dealId, { value: total });
        }
        return this.toPublicShape(quote);
    }
    async deleteQuote(id) {
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote)
            throw new app_exception_1.AppException('QUOTE_NOT_FOUND', 'Quote not found.', common_1.HttpStatus.NOT_FOUND);
        if (quote.status === client_1.QuoteStatus.CONVERTED) {
            throw new app_exception_1.AppException('QUOTE_ALREADY_CONVERTED', 'A converted quote cannot be deleted.', common_1.HttpStatus.CONFLICT);
        }
        await this.prisma.quote.delete({ where: { id } });
    }
    async convertQuote(id, createdByUserId) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: QUOTE_INCLUDE,
        });
        if (!quote)
            throw new app_exception_1.AppException('QUOTE_NOT_FOUND', 'Quote not found.', common_1.HttpStatus.NOT_FOUND);
        if (quote.status === client_1.QuoteStatus.CONVERTED) {
            throw new app_exception_1.AppException('QUOTE_ALREADY_CONVERTED', 'This quote has already been converted to an order.', common_1.HttpStatus.CONFLICT);
        }
        if (!CONVERTIBLE_QUOTE_STATUSES.includes(quote.status)) {
            throw new app_exception_1.AppException('QUOTE_NOT_CONVERTIBLE', 'Send the quote before converting it to an order.', common_1.HttpStatus.CONFLICT);
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
                    status: client_1.QuoteStatus.CONVERTED,
                    convertedToOrderId: createdOrder.id,
                },
            });
            return createdOrder;
        });
        return {
            quote: this.toPublicShape({
                ...quote,
                status: client_1.QuoteStatus.CONVERTED,
                convertedToOrderId: order.id,
            }),
            order: {
                ...order,
                items: order.items.map((item) => this.itemToPublicShape(item)),
            },
        };
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        customers_service_1.CustomersService,
        deals_service_1.DealsService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map