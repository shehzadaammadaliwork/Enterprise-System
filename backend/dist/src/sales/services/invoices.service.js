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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const sales_util_1 = require("../sales.util");
const INVOICE_INCLUDE = {
    payments: { orderBy: { paidAt: 'asc' } },
    order: { include: { items: { orderBy: { createdAt: 'asc' } } } },
};
let InvoicesService = class InvoicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toPublicShape(invoice) {
        const paid = invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new client_1.Prisma.Decimal(0));
        return {
            ...invoice,
            totalAmount: Number(invoice.totalAmount),
            amountPaid: Number(paid.toDecimalPlaces(2)),
            outstandingBalance: Number(new client_1.Prisma.Decimal(invoice.totalAmount).minus(paid).toDecimalPlaces(2)),
        };
    }
    async listInvoices(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getInvoice(id) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: INVOICE_INCLUDE,
        });
        if (!invoice)
            throw new app_exception_1.AppException('INVOICE_NOT_FOUND', 'Invoice not found.', common_1.HttpStatus.NOT_FOUND);
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
                summary: (0, sales_util_1.summarizeItems)(invoice.order.items),
            },
        };
    }
    async generateFromOrder(orderId, createdByUserId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, invoice: { select: { id: true } } },
        });
        if (!order)
            throw new app_exception_1.AppException('ORDER_NOT_FOUND', 'Order not found.', common_1.HttpStatus.NOT_FOUND);
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new app_exception_1.AppException('ORDER_CANCELLED', 'A cancelled order cannot be invoiced.', common_1.HttpStatus.CONFLICT);
        }
        if (order.invoice) {
            throw new app_exception_1.AppException('ORDER_ALREADY_INVOICED', 'This order has already been invoiced.', common_1.HttpStatus.CONFLICT);
        }
        const { total } = (0, sales_util_1.summarizeItems)(order.items);
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
    async updateInvoice(id, dto) {
        await this.requireNotVoid(id);
        await this.prisma.invoice.update({
            where: { id },
            data: { dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
        });
        return this.getInvoice(id);
    }
    async requireNotVoid(id) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice)
            throw new app_exception_1.AppException('INVOICE_NOT_FOUND', 'Invoice not found.', common_1.HttpStatus.NOT_FOUND);
        if (invoice.status === client_1.InvoiceStatus.VOID) {
            throw new app_exception_1.AppException('INVOICE_VOID', 'A voided invoice cannot be modified.', common_1.HttpStatus.CONFLICT);
        }
        return invoice;
    }
    async voidInvoice(id) {
        await this.requireNotVoid(id);
        await this.prisma.invoice.update({
            where: { id },
            data: { status: client_1.InvoiceStatus.VOID },
        });
        return this.getInvoice(id);
    }
    async recomputeStatus(tx, invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({
            where: { id: invoiceId },
            include: { payments: true },
        });
        if (invoice.status === client_1.InvoiceStatus.VOID)
            return;
        const paid = invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new client_1.Prisma.Decimal(0));
        const status = paid.greaterThanOrEqualTo(invoice.totalAmount)
            ? client_1.InvoiceStatus.PAID
            : paid.greaterThan(0)
                ? client_1.InvoiceStatus.PARTIALLY_PAID
                : client_1.InvoiceStatus.UNPAID;
        await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
    }
    async getOutstandingSummary() {
        const outstandingInvoices = await this.prisma.invoice.findMany({
            where: {
                status: {
                    in: [client_1.InvoiceStatus.UNPAID, client_1.InvoiceStatus.PARTIALLY_PAID],
                },
            },
            include: { payments: true },
        });
        const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => {
            const paid = invoice.payments.reduce((paidSum, payment) => paidSum.plus(payment.amount), new client_1.Prisma.Decimal(0));
            return sum.plus(new client_1.Prisma.Decimal(invoice.totalAmount).minus(paid));
        }, new client_1.Prisma.Decimal(0));
        return {
            outstandingInvoicesCount: outstandingInvoices.length,
            outstandingInvoicesTotal: Number(outstandingTotal.toDecimalPlaces(2)),
        };
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map