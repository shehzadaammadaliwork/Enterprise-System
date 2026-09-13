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
exports.AssetsService = void 0;
exports.isValidAssetStatusTransition = isValidAssetStatusTransition;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const employees_service_1 = require("../../employees/services/employees.service");
const VALID_TRANSITIONS = {
    AVAILABLE: ['ASSIGNED', 'UNDER_REPAIR', 'RETIRED'],
    ASSIGNED: ['AVAILABLE', 'UNDER_REPAIR', 'RETIRED'],
    UNDER_REPAIR: ['AVAILABLE', 'RETIRED'],
    RETIRED: [],
};
function isValidAssetStatusTransition(from, to) {
    if (from === to)
        return false;
    return VALID_TRANSITIONS[from].includes(to);
}
let AssetsService = class AssetsService {
    prisma;
    employeesService;
    constructor(prisma, employeesService) {
        this.prisma = prisma;
        this.employeesService = employeesService;
    }
    toPublicShape(asset) {
        return {
            ...asset,
            purchaseCost: asset.purchaseCost === null ? null : Number(asset.purchaseCost),
        };
    }
    async listAssets(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.status && { status: query.status }),
            ...(query.category && { category: query.category }),
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { serialNumber: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.asset.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.asset.count({ where }),
        ]);
        return {
            items: items.map((asset) => this.toPublicShape(asset)),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getAssetOrThrow(id) {
        const asset = await this.prisma.asset.findUnique({ where: { id } });
        if (!asset)
            throw new app_exception_1.AppException('ASSET_NOT_FOUND', 'Asset not found.', common_1.HttpStatus.NOT_FOUND);
        return asset;
    }
    async getAsset(id) {
        return this.toPublicShape(await this.getAssetOrThrow(id));
    }
    async createAsset(dto) {
        const asset = await this.prisma.asset.create({
            data: {
                name: dto.name,
                category: dto.category,
                serialNumber: dto.serialNumber,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
                purchaseCost: dto.purchaseCost,
                notes: dto.notes,
            },
        });
        return this.toPublicShape(asset);
    }
    async updateAsset(id, dto) {
        await this.getAssetOrThrow(id);
        const asset = await this.prisma.asset.update({
            where: { id },
            data: {
                ...dto,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
            },
        });
        return this.toPublicShape(asset);
    }
    async changeStatus(id, dto) {
        const asset = await this.getAssetOrThrow(id);
        if (!isValidAssetStatusTransition(asset.status, dto.status)) {
            throw new app_exception_1.AppException('INVALID_ASSET_STATUS_TRANSITION', `Cannot move an asset from ${asset.status} to ${dto.status}.`, common_1.HttpStatus.BAD_REQUEST);
        }
        let assignedEmployeeId = null;
        if (dto.status === client_1.AssetStatus.ASSIGNED) {
            if (!dto.assignedEmployeeId) {
                throw new app_exception_1.AppException('ASSET_ASSIGNMENT_REQUIRES_EMPLOYEE', 'Assigning an asset requires selecting an employee.', common_1.HttpStatus.BAD_REQUEST);
            }
            await this.employeesService.requireEmployeeExists(dto.assignedEmployeeId);
            assignedEmployeeId = dto.assignedEmployeeId;
        }
        const updated = await this.prisma.asset.update({
            where: { id },
            data: {
                status: dto.status,
                assignedEmployeeId,
                retirementReason: dto.status === client_1.AssetStatus.RETIRED ? dto.retirementReason : null,
            },
        });
        return this.toPublicShape(updated);
    }
    async deleteAsset(id) {
        const asset = await this.getAssetOrThrow(id);
        if (asset.status !== client_1.AssetStatus.AVAILABLE) {
            throw new app_exception_1.AppException('ASSET_NOT_DELETABLE', 'Only an available asset (never assigned, repaired, or retired) can be deleted — change its status to reflect reality instead.', common_1.HttpStatus.CONFLICT);
        }
        await this.prisma.asset.delete({ where: { id } });
    }
    async createFromPurchase(input) {
        const asset = await this.prisma.asset.create({
            data: {
                name: input.name,
                category: 'OTHER_EQUIPMENT',
                purchaseDate: new Date(),
                purchaseCost: input.purchaseCost,
                purchaseRequestId: input.purchaseRequestId,
                status: input.assignedEmployeeId
                    ? client_1.AssetStatus.ASSIGNED
                    : client_1.AssetStatus.AVAILABLE,
                assignedEmployeeId: input.assignedEmployeeId,
            },
        });
        return this.toPublicShape(asset);
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        employees_service_1.EmployeesService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map