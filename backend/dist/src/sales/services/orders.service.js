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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const sales_util_1 = require("../sales.util");
const ORDER_INCLUDE = {
    items: { orderBy: { createdAt: 'asc' } },
    invoice: { select: { id: true, number: true, status: true } },
};
const ORDER_SEQUENCE = [
    client_1.OrderStatus.PENDING,
    client_1.OrderStatus.CONFIRMED,
    client_1.OrderStatus.FULFILLED,
];
function isValidOrderStatusTransition(from, to) {
    if (from === to)
        return true;
    if (from === client_1.OrderStatus.CANCELLED || from === client_1.OrderStatus.FULFILLED)
        return false;
    if (to === client_1.OrderStatus.CANCELLED)
        return true;
    const fromIndex = ORDER_SEQUENCE.indexOf(from);
    const toIndex = ORDER_SEQUENCE.indexOf(to);
    return fromIndex !== -1 && toIndex === fromIndex + 1;
}
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toPublicShape(order) {
        const items = order.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRatePercent: Number(item.taxRatePercent),
            lineTotal: Number(item.lineTotal),
        }));
        return { ...order, items, summary: (0, sales_util_1.summarizeItems)(order.items) };
    }
    async listOrders(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getOrder(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: ORDER_INCLUDE,
        });
        if (!order)
            throw new app_exception_1.AppException('ORDER_NOT_FOUND', 'Order not found.', common_1.HttpStatus.NOT_FOUND);
        return this.toPublicShape(order);
    }
    async updateOrder(id, dto) {
        const existing = await this.prisma.order.findUnique({
            where: { id },
            include: { invoice: { select: { id: true, status: true } } },
        });
        if (!existing)
            throw new app_exception_1.AppException('ORDER_NOT_FOUND', 'Order not found.', common_1.HttpStatus.NOT_FOUND);
        if (!isValidOrderStatusTransition(existing.status, dto.status)) {
            throw new app_exception_1.AppException('ORDER_INVALID_STATUS_TRANSITION', `An order cannot move from ${existing.status} to ${dto.status} — orders must progress Pending → Confirmed → Fulfilled, or be Cancelled from Pending or Confirmed.`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.status === client_1.OrderStatus.CANCELLED &&
            existing.invoice &&
            existing.invoice.status !== client_1.InvoiceStatus.VOID) {
            throw new app_exception_1.AppException('ORDER_ALREADY_INVOICED', 'This order already has an invoice — void the invoice instead of cancelling the order.', common_1.HttpStatus.CONFLICT);
        }
        const order = await this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: ORDER_INCLUDE,
        });
        return this.toPublicShape(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map