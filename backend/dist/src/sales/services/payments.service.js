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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const invoices_service_1 = require("./invoices.service");
let PaymentsService = class PaymentsService {
    prisma;
    invoicesService;
    constructor(prisma, invoicesService) {
        this.prisma = prisma;
        this.invoicesService = invoicesService;
    }
    toPublicShape(payment) {
        return { ...payment, amount: Number(payment.amount) };
    }
    async listPayments(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async createPayment(dto, recordedByUserId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: dto.invoiceId },
        });
        if (!invoice)
            throw new app_exception_1.AppException('INVOICE_NOT_FOUND', 'Invoice not found.', common_1.HttpStatus.NOT_FOUND);
        if (invoice.status === client_1.InvoiceStatus.VOID) {
            throw new app_exception_1.AppException('INVOICE_VOID', 'Cannot record a payment against a voided invoice.', common_1.HttpStatus.CONFLICT);
        }
        if (invoice.status === client_1.InvoiceStatus.PAID) {
            throw new app_exception_1.AppException('INVOICE_ALREADY_PAID', 'This invoice is already fully paid.', common_1.HttpStatus.CONFLICT);
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
    async getRevenueThisMonth() {
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const result = await this.prisma.payment.aggregate({
            where: { paidAt: { gte: startOfMonth } },
            _sum: { amount: true },
        });
        return { revenueThisMonth: Number(result._sum.amount ?? 0) };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        invoices_service_1.InvoicesService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map