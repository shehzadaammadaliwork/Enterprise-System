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
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const DEAL_INCLUDE = {
    customer: { select: { id: true, companyName: true, contactName: true } },
};
const DEAL_SEQUENCE = [
    client_1.DealStage.NEW,
    client_1.DealStage.QUALIFIED,
    client_1.DealStage.PROPOSAL,
    client_1.DealStage.NEGOTIATION,
    client_1.DealStage.WON,
];
function isValidDealStageTransition(from, to) {
    if (from === to)
        return true;
    if (from === client_1.DealStage.WON || from === client_1.DealStage.LOST)
        return false;
    if (to === client_1.DealStage.LOST)
        return true;
    const fromIndex = DEAL_SEQUENCE.indexOf(from);
    const toIndex = DEAL_SEQUENCE.indexOf(to);
    return fromIndex !== -1 && toIndex === fromIndex + 1;
}
let DealsService = class DealsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toPublicShape(deal) {
        return { ...deal, value: deal.value === null ? null : Number(deal.value) };
    }
    async listDeals(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.customerId && { customerId: query.customerId }),
            ...(query.stage && { stage: query.stage }),
        };
        const [items, total] = await Promise.all([
            this.prisma.deal.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: DEAL_INCLUDE,
            }),
            this.prisma.deal.count({ where }),
        ]);
        return {
            items: items.map((deal) => this.toPublicShape(deal)),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getDeal(id) {
        const deal = await this.prisma.deal.findUnique({
            where: { id },
            include: DEAL_INCLUDE,
        });
        if (!deal)
            throw new app_exception_1.AppException('DEAL_NOT_FOUND', 'Deal not found.', common_1.HttpStatus.NOT_FOUND);
        return this.toPublicShape(deal);
    }
    async requireCustomerExists(customerId) {
        const exists = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: { id: true },
        });
        if (!exists)
            throw new app_exception_1.AppException('CUSTOMER_NOT_FOUND', 'Customer not found.', common_1.HttpStatus.NOT_FOUND);
    }
    async createDeal(dto) {
        await this.requireCustomerExists(dto.customerId);
        const { expectedCloseDate, ...rest } = dto;
        const deal = await this.prisma.deal.create({
            data: {
                ...rest,
                expectedCloseDate: expectedCloseDate
                    ? new Date(expectedCloseDate)
                    : undefined,
            },
            include: DEAL_INCLUDE,
        });
        return this.toPublicShape(deal);
    }
    async updateDeal(id, dto) {
        const existing = await this.getDeal(id);
        if (dto.stage && !isValidDealStageTransition(existing.stage, dto.stage)) {
            throw new app_exception_1.AppException('DEAL_INVALID_STAGE_TRANSITION', `A deal cannot move from ${existing.stage} to ${dto.stage} — deals must progress one stage at a time (New → Qualified → Proposal → Negotiation → Won), or be marked Lost.`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.customerId)
            await this.requireCustomerExists(dto.customerId);
        const { expectedCloseDate, ...rest } = dto;
        const deal = await this.prisma.deal.update({
            where: { id },
            data: {
                ...rest,
                expectedCloseDate: expectedCloseDate
                    ? new Date(expectedCloseDate)
                    : undefined,
            },
            include: DEAL_INCLUDE,
        });
        return this.toPublicShape(deal);
    }
    async deleteDeal(id) {
        await this.getDeal(id);
        await this.prisma.deal.delete({ where: { id } });
    }
    async getPipelineSummary() {
        const openDeals = await this.prisma.deal.findMany({
            where: { stage: { notIn: [client_1.DealStage.WON, client_1.DealStage.LOST] } },
            select: { value: true },
        });
        const openPipelineValue = openDeals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0);
        return { openDealCount: openDeals.length, openPipelineValue };
    }
    async getPerformanceReport(dateFrom, dateTo, assignedToUserId) {
        const where = {
            createdAt: { gte: dateFrom, lte: dateTo },
            ...(assignedToUserId && { assignedToUserId }),
        };
        const grouped = await this.prisma.deal.groupBy({
            by: ['assignedToUserId', 'stage'],
            where,
            _sum: { value: true },
            _count: { _all: true },
        });
        const byRepMap = new Map();
        for (const row of grouped) {
            const key = row.assignedToUserId ?? '__unassigned__';
            const entry = byRepMap.get(key) ?? {
                assignedToUserId: row.assignedToUserId,
                totalDeals: 0,
                wonDeals: 0,
                lostDeals: 0,
                openDeals: 0,
                wonValue: 0,
            };
            entry.totalDeals += row._count._all;
            if (row.stage === client_1.DealStage.WON) {
                entry.wonDeals += row._count._all;
                entry.wonValue += Number(row._sum.value ?? 0);
            }
            else if (row.stage === client_1.DealStage.LOST) {
                entry.lostDeals += row._count._all;
            }
            else {
                entry.openDeals += row._count._all;
            }
            byRepMap.set(key, entry);
        }
        const byRep = [...byRepMap.values()].map((entry) => ({
            ...entry,
            winRate: entry.wonDeals + entry.lostDeals === 0
                ? 0
                : entry.wonDeals / (entry.wonDeals + entry.lostDeals),
        }));
        const totals = byRep.reduce((sum, rep) => ({
            totalDeals: sum.totalDeals + rep.totalDeals,
            wonDeals: sum.wonDeals + rep.wonDeals,
            lostDeals: sum.lostDeals + rep.lostDeals,
            openDeals: sum.openDeals + rep.openDeals,
            wonValue: sum.wonValue + rep.wonValue,
        }), { totalDeals: 0, wonDeals: 0, lostDeals: 0, openDeals: 0, wonValue: 0 });
        return {
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
            ...totals,
            winRate: totals.wonDeals + totals.lostDeals === 0
                ? 0
                : totals.wonDeals / (totals.wonDeals + totals.lostDeals),
            byRep: byRep.sort((a, b) => b.wonValue - a.wonValue),
        };
    }
};
exports.DealsService = DealsService;
exports.DealsService = DealsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealsService);
//# sourceMappingURL=deals.service.js.map