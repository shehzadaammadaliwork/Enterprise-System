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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCustomers(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.search && {
                OR: [
                    { companyName: { contains: query.search, mode: 'insensitive' } },
                    { contactName: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getCustomer(id) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new app_exception_1.AppException('CUSTOMER_NOT_FOUND', 'Customer not found.', common_1.HttpStatus.NOT_FOUND);
        return customer;
    }
    createCustomer(dto) {
        return this.prisma.customer.create({ data: dto });
    }
    async updateCustomer(id, dto) {
        await this.getCustomer(id);
        return this.prisma.customer.update({ where: { id }, data: dto });
    }
    async deleteCustomer(id) {
        await this.getCustomer(id);
        await this.prisma.customer.delete({ where: { id } });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map