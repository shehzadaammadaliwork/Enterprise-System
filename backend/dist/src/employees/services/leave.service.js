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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const employees_service_1 = require("./employees.service");
const notifications_service_1 = require("../../notifications/services/notifications.service");
const rbac_service_1 = require("../../rbac/rbac.service");
let LeaveService = class LeaveService {
    prisma;
    employeesService;
    notificationsService;
    rbacService;
    constructor(prisma, employeesService, notificationsService, rbacService) {
        this.prisma = prisma;
        this.employeesService = employeesService;
        this.notificationsService = notificationsService;
        this.rbacService = rbacService;
    }
    async createRequest(employeeId, dto) {
        await this.employeesService.requireEmployeeExists(employeeId);
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (endDate < startDate) {
            throw new app_exception_1.AppException('INVALID_LEAVE_RANGE', 'endDate must be on or after startDate.', common_1.HttpStatus.BAD_REQUEST);
        }
        const request = await this.prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveType: dto.leaveType,
                startDate,
                endDate,
                reason: dto.reason,
            },
        });
        const approverUserIds = await this.rbacService.getUserIdsWithPermission('employees', 'EDIT');
        await Promise.all(approverUserIds.map((userId) => this.notificationsService.notify(userId, client_1.NotificationEventType.LEAVE_REQUEST_SUBMITTED, 'New leave request', `A ${dto.leaveType.toLowerCase()} leave request is awaiting your review.`, { leaveRequestId: request.id })));
        return request;
    }
    async listForEmployee(employeeId, query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.leaveRequest.findMany({
                where: { employeeId },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.leaveRequest.count({ where: { employeeId } }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async listAll(query, status, employeeId) {
        const where = {
            ...(status ? { status } : {}),
            ...(employeeId ? { employeeId } : {}),
        };
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.leaveRequest.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    employee: {
                        select: {
                            id: true,
                            designation: true,
                            user: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.leaveRequest.count({ where }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getRequest(id) {
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        designation: true,
                        user: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
        if (!request)
            throw new app_exception_1.AppException('LEAVE_REQUEST_NOT_FOUND', 'Leave request not found.', common_1.HttpStatus.NOT_FOUND);
        return request;
    }
    async decide(id, decidedByUserId, approve) {
        const request = await this.prisma.leaveRequest.findUnique({
            where: { id },
            include: { employee: { select: { userId: true } } },
        });
        if (!request)
            throw new app_exception_1.AppException('LEAVE_REQUEST_NOT_FOUND', 'Leave request not found.', common_1.HttpStatus.NOT_FOUND);
        if (request.status !== client_1.LeaveStatus.PENDING) {
            throw new app_exception_1.AppException('LEAVE_REQUEST_ALREADY_DECIDED', 'This leave request has already been decided.', common_1.HttpStatus.CONFLICT);
        }
        const updated = await this.prisma.leaveRequest.update({
            where: { id },
            data: {
                status: approve ? client_1.LeaveStatus.APPROVED : client_1.LeaveStatus.REJECTED,
                decidedByUserId,
                decidedAt: new Date(),
            },
        });
        await this.notificationsService.notify(request.employee.userId, client_1.NotificationEventType.LEAVE_REQUEST_DECIDED, `Leave request ${approve ? 'approved' : 'rejected'}`, `Your ${request.leaveType.toLowerCase()} leave request has been ${approve ? 'approved' : 'rejected'}.`, { leaveRequestId: id });
        return updated;
    }
    async getMyLeaveSummary(employeeId) {
        const now = new Date();
        const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        const yearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
        const [pendingCount, approvedThisYear] = await Promise.all([
            this.prisma.leaveRequest.count({
                where: { employeeId, status: client_1.LeaveStatus.PENDING },
            }),
            this.prisma.leaveRequest.findMany({
                where: {
                    employeeId,
                    status: client_1.LeaveStatus.APPROVED,
                    startDate: { lte: yearEnd },
                    endDate: { gte: yearStart },
                },
                select: { startDate: true, endDate: true },
            }),
        ]);
        const approvedDaysThisYear = approvedThisYear.reduce((sum, request) => {
            const start = request.startDate < yearStart ? yearStart : request.startDate;
            const end = request.endDate > yearEnd ? yearEnd : request.endDate;
            const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
            return sum + days;
        }, 0);
        return { pendingLeaveRequests: pendingCount, approvedDaysThisYear };
    }
    async listApprovedInRange(dateFrom, dateTo, departmentId) {
        return this.prisma.leaveRequest.findMany({
            where: {
                status: client_1.LeaveStatus.APPROVED,
                startDate: { lte: dateTo },
                endDate: { gte: dateFrom },
                ...(departmentId ? { employee: { departmentId } } : {}),
            },
            include: {
                employee: {
                    select: {
                        userId: true,
                        departmentId: true,
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        employees_service_1.EmployeesService,
        notifications_service_1.NotificationsService,
        rbac_service_1.RbacService])
], LeaveService);
//# sourceMappingURL=leave.service.js.map