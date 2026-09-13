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
exports.PerformanceReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const employees_service_1 = require("./employees.service");
let PerformanceReviewService = class PerformanceReviewService {
    prisma;
    employeesService;
    constructor(prisma, employeesService) {
        this.prisma = prisma;
        this.employeesService = employeesService;
    }
    async createReview(employeeId, reviewerUserId, dto) {
        await this.employeesService.requireEmployeeExists(employeeId);
        return this.prisma.performanceReview.create({
            data: {
                employeeId,
                reviewerUserId,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                rating: dto.rating,
                notes: dto.notes,
            },
        });
    }
    async listForEmployee(employeeId, query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.performanceReview.findMany({
                where: { employeeId },
                skip,
                take,
                orderBy: { periodStart: 'desc' },
            }),
            this.prisma.performanceReview.count({ where: { employeeId } }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
};
exports.PerformanceReviewService = PerformanceReviewService;
exports.PerformanceReviewService = PerformanceReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        employees_service_1.EmployeesService])
], PerformanceReviewService);
//# sourceMappingURL=performance-review.service.js.map