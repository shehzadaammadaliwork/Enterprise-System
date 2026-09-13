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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProducts(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.type && { type: query.type }),
            ...(query.search && {
                name: { contains: query.search, mode: 'insensitive' },
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            items,
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getProduct(id) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new app_exception_1.AppException('PRODUCT_NOT_FOUND', 'Product not found.', common_1.HttpStatus.NOT_FOUND);
        return product;
    }
    async createProduct(dto) {
        return this.prisma.product.create({ data: dto });
    }
    async updateProduct(id, dto) {
        await this.getProduct(id);
        return this.prisma.product.update({
            where: { id },
            data: dto,
        });
    }
    async deleteProduct(id) {
        await this.getProduct(id);
        const [quoteItemCount, orderItemCount] = await Promise.all([
            this.prisma.quoteItem.count({ where: { productId: id } }),
            this.prisma.orderItem.count({ where: { productId: id } }),
        ]);
        if (quoteItemCount > 0 || orderItemCount > 0) {
            throw new app_exception_1.AppException('PRODUCT_IN_USE', 'This product appears on an existing quote or order and cannot be deleted — deactivate it instead.', common_1.HttpStatus.CONFLICT);
        }
        await this.prisma.product.delete({ where: { id } });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map