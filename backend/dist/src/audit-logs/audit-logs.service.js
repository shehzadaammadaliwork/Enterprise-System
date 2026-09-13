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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const app_exception_1 = require("../common/filters/app-exception");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
let AuditLogsService = class AuditLogsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listAuditLogs(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.userEmail && {
                userEmail: { contains: query.userEmail, mode: 'insensitive' },
            }),
            ...(query.module && { module: query.module }),
            ...(query.action && { action: query.action }),
            ...(query.entityType && {
                entityType: { contains: query.entityType, mode: 'insensitive' },
            }),
            ...((query.dateFrom || query.dateTo) && {
                createdAt: {
                    ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
                    ...(query.dateTo && { lte: new Date(query.dateTo) }),
                },
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async listDistinctModules() {
        const rows = await this.prisma.auditLog.findMany({
            distinct: ['module'],
            select: { module: true },
            orderBy: { module: 'asc' },
        });
        return rows.map((row) => row.module);
    }
    async getAuditLog(id) {
        const log = await this.prisma.auditLog.findUnique({ where: { id } });
        if (!log)
            throw new app_exception_1.AppException('AUDIT_LOG_NOT_FOUND', 'Audit log entry not found.', common_1.HttpStatus.NOT_FOUND);
        return log;
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map