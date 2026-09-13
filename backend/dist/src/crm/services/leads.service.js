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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const LEAD_SEQUENCE = [
    client_1.LeadStatus.NEW,
    client_1.LeadStatus.CONTACTED,
    client_1.LeadStatus.QUALIFIED,
];
function isValidLeadStatusTransition(from, to) {
    if (from === to)
        return true;
    if (from === client_1.LeadStatus.LOST)
        return false;
    if (to === client_1.LeadStatus.LOST)
        return true;
    const fromIndex = LEAD_SEQUENCE.indexOf(from);
    const toIndex = LEAD_SEQUENCE.indexOf(to);
    return fromIndex !== -1 && toIndex === fromIndex + 1;
}
let LeadsService = class LeadsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listLeads(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.status && { status: query.status }),
            ...(query.search && {
                OR: [
                    { companyName: { contains: query.search, mode: 'insensitive' } },
                    { contactName: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.lead.count({ where }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getLead(id) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead)
            throw new app_exception_1.AppException('LEAD_NOT_FOUND', 'Lead not found.', common_1.HttpStatus.NOT_FOUND);
        return lead;
    }
    createLead(dto) {
        return this.prisma.lead.create({ data: dto });
    }
    async updateLead(id, dto) {
        const existing = await this.getLead(id);
        if (dto.status === client_1.LeadStatus.CONVERTED) {
            throw new app_exception_1.AppException('LEAD_STATUS_CONVERTED_NOT_ALLOWED', 'A lead can only reach CONVERTED status via POST /crm/leads/:id/convert.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.status &&
            !isValidLeadStatusTransition(existing.status, dto.status)) {
            throw new app_exception_1.AppException('LEAD_INVALID_STATUS_TRANSITION', `A lead cannot move from ${existing.status} to ${dto.status} — leads must progress one stage at a time (New → Contacted → Qualified), or be marked Lost.`, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.prisma.lead.update({ where: { id }, data: dto });
    }
    async deleteLead(id) {
        await this.getLead(id);
        await this.prisma.lead.delete({ where: { id } });
    }
    async convertLead(id) {
        const lead = await this.getLead(id);
        if (lead.status === client_1.LeadStatus.CONVERTED) {
            throw new app_exception_1.AppException('LEAD_ALREADY_CONVERTED', 'This lead has already been converted to a customer.', common_1.HttpStatus.CONFLICT);
        }
        if (lead.status !== client_1.LeadStatus.QUALIFIED) {
            throw new app_exception_1.AppException('LEAD_NOT_QUALIFIED', 'Only a Qualified lead can be converted to a customer — move it through Contacted and Qualified first.', common_1.HttpStatus.CONFLICT);
        }
        const customer = await this.prisma.customer.create({
            data: {
                companyName: lead.companyName,
                contactName: lead.contactName,
                email: lead.email,
                phone: lead.phone,
            },
        });
        const updatedLead = await this.prisma.lead.update({
            where: { id },
            data: {
                status: client_1.LeadStatus.CONVERTED,
                convertedToCustomerId: customer.id,
            },
        });
        return { lead: updatedLead, customer };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map