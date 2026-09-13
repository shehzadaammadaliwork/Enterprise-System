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
exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const app_exception_1 = require("../common/filters/app-exception");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
let OrganizationService = class OrganizationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanyProfile() {
        const existing = await this.prisma.companyProfile.findFirst();
        if (existing)
            return existing;
        return this.prisma.companyProfile.create({ data: { name: 'My Company' } });
    }
    async updateCompanyProfile(dto) {
        const profile = await this.getCompanyProfile();
        return this.prisma.companyProfile.update({
            where: { id: profile.id },
            data: dto,
        });
    }
    async listBranches(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.branch.findMany({ skip, take, orderBy: { name: 'asc' } }),
            this.prisma.branch.count(),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getBranch(id) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch)
            throw new app_exception_1.AppException('BRANCH_NOT_FOUND', 'Branch not found.', common_1.HttpStatus.NOT_FOUND);
        return branch;
    }
    createBranch(dto) {
        return this.prisma.branch.create({ data: dto });
    }
    async updateBranch(id, dto) {
        await this.getBranch(id);
        return this.prisma.branch.update({ where: { id }, data: dto });
    }
    async deleteBranch(id) {
        await this.getBranch(id);
        await this.prisma.branch.delete({ where: { id } });
    }
    async listDepartments(query, branchId) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = branchId ? { branchId } : undefined;
        const [items, total] = await Promise.all([
            this.prisma.department.findMany({
                where,
                skip,
                take,
                orderBy: { name: 'asc' },
                include: { branch: true, parent: true },
            }),
            this.prisma.department.count({ where }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getDepartment(id) {
        const department = await this.prisma.department.findUnique({
            where: { id },
            include: { branch: true, parent: true, children: true },
        });
        if (!department)
            throw new app_exception_1.AppException('DEPARTMENT_NOT_FOUND', 'Department not found.', common_1.HttpStatus.NOT_FOUND);
        return department;
    }
    async getDepartmentTree() {
        const all = await this.prisma.department.findMany({
            orderBy: { name: 'asc' },
            include: { branch: true },
        });
        const byId = new Map(all.map((dept) => [dept.id, { ...dept, children: [] }]));
        const roots = [];
        for (const node of byId.values()) {
            if (node.parentId && byId.has(node.parentId)) {
                byId.get(node.parentId).children.push(node);
            }
            else {
                roots.push(node);
            }
        }
        return roots;
    }
    async createDepartment(dto) {
        if (dto.parentId) {
            await this.assertNotCircular(dto.parentId);
        }
        return this.prisma.department.create({ data: dto });
    }
    async updateDepartment(id, dto) {
        await this.getDepartment(id);
        if (dto.parentId) {
            await this.assertNotCircular(dto.parentId, id);
        }
        return this.prisma.department.update({ where: { id }, data: dto });
    }
    async deleteDepartment(id) {
        await this.getDepartment(id);
        await this.prisma.department.delete({ where: { id } });
    }
    async assertNotCircular(candidateParentId, id) {
        if (id && candidateParentId === id) {
            throw new app_exception_1.AppException('CIRCULAR_DEPARTMENT_HIERARCHY', 'A department cannot be its own parent.', common_1.HttpStatus.BAD_REQUEST);
        }
        let currentId = candidateParentId;
        const visited = new Set();
        while (currentId) {
            if (id && currentId === id) {
                throw new app_exception_1.AppException('CIRCULAR_DEPARTMENT_HIERARCHY', 'This would create a circular department hierarchy.', common_1.HttpStatus.BAD_REQUEST);
            }
            if (visited.has(currentId))
                break;
            visited.add(currentId);
            const parent = await this.prisma.department.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });
            currentId = parent?.parentId ?? null;
        }
    }
    async listHolidays(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.companyHoliday.findMany({
                skip,
                take,
                orderBy: { date: 'asc' },
            }),
            this.prisma.companyHoliday.count(),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getHoliday(id) {
        const holiday = await this.prisma.companyHoliday.findUnique({
            where: { id },
        });
        if (!holiday)
            throw new app_exception_1.AppException('HOLIDAY_NOT_FOUND', 'Holiday not found.', common_1.HttpStatus.NOT_FOUND);
        return holiday;
    }
    createHoliday(dto) {
        return this.prisma.companyHoliday.create({
            data: { ...dto, date: new Date(dto.date) },
        });
    }
    async updateHoliday(id, dto) {
        await this.getHoliday(id);
        return this.prisma.companyHoliday.update({
            where: { id },
            data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
        });
    }
    async deleteHoliday(id) {
        await this.getHoliday(id);
        await this.prisma.companyHoliday.delete({ where: { id } });
    }
    async listHolidaysInRange(dateFrom, dateTo) {
        const holidays = await this.prisma.companyHoliday.findMany();
        const occurrences = [];
        for (const holiday of holidays) {
            if (!holiday.recurringAnnually) {
                if (holiday.date >= dateFrom && holiday.date <= dateTo) {
                    occurrences.push(holiday);
                }
                continue;
            }
            for (let year = dateFrom.getUTCFullYear(); year <= dateTo.getUTCFullYear(); year++) {
                const occurrence = new Date(Date.UTC(year, holiday.date.getUTCMonth(), holiday.date.getUTCDate()));
                if (occurrence >= dateFrom && occurrence <= dateTo) {
                    occurrences.push({ ...holiday, date: occurrence });
                }
            }
        }
        return occurrences;
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationService);
//# sourceMappingURL=organization.service.js.map