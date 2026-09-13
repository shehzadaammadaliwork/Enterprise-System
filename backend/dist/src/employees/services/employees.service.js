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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const encryption_service_1 = require("../../common/security/encryption.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const EMPLOYEE_INCLUDE = {
    department: true,
    reportingManager: {
        select: {
            id: true,
            designation: true,
            user: {
                select: { id: true, firstName: true, lastName: true, email: true },
            },
        },
    },
    user: { select: { id: true, firstName: true, lastName: true, email: true } },
};
let EmployeesService = class EmployeesService {
    prisma;
    encryption;
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    toPublicShape(employee, includeSalary) {
        const { salaryEncrypted, ...rest } = employee;
        return {
            ...rest,
            ...(includeSalary
                ? { salary: Number(this.encryption.decrypt(salaryEncrypted)) }
                : {}),
        };
    }
    async createEmployee(dto, includeSalary) {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user)
            throw new app_exception_1.AppException('USER_NOT_FOUND', 'No user with this id exists.', common_1.HttpStatus.NOT_FOUND);
        if (user.isSystemAccount) {
            throw new app_exception_1.AppException('SYSTEM_ACCOUNT_NOT_LINKABLE', 'The system administrator account cannot be linked to an employee profile.', common_1.HttpStatus.FORBIDDEN);
        }
        const existingProfile = await this.prisma.employee.findUnique({
            where: { userId: dto.userId },
        });
        if (existingProfile) {
            throw new app_exception_1.AppException('EMPLOYEE_PROFILE_EXISTS', 'This user already has an employee profile.', common_1.HttpStatus.CONFLICT);
        }
        const { salary, roleIds, ...rest } = dto;
        const employee = await this.prisma.employee.create({
            data: {
                ...rest,
                joiningDate: new Date(dto.joiningDate),
                salaryEncrypted: this.encryption.encrypt(String(salary)),
            },
            include: EMPLOYEE_INCLUDE,
        });
        return this.toPublicShape(employee, includeSalary);
    }
    async listUsers(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.search
                ? {
                    OR: [
                        {
                            email: { contains: query.search, mode: 'insensitive' },
                        },
                        {
                            firstName: {
                                contains: query.search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            lastName: {
                                contains: query.search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {}),
            ...(query.needsOnboarding === 'true'
                ? { employee: null, isSystemAccount: false }
                : {}),
            ...(query.needsOnboarding === 'false'
                ? { employee: { isNot: null } }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    employee: { select: { id: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            items: items.map(({ employee, ...user }) => ({
                ...user,
                hasEmployeeProfile: !!employee,
            })),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async listEmployees(query, departmentId, includeSalary, status) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(departmentId && { departmentId }),
            ...(status && { status }),
        };
        const [items, total] = await Promise.all([
            this.prisma.employee.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: EMPLOYEE_INCLUDE,
            }),
            this.prisma.employee.count({ where }),
        ]);
        return {
            items: items.map((employee) => this.toPublicShape(employee, includeSalary)),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getEmployee(id, includeSalary) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            include: EMPLOYEE_INCLUDE,
        });
        if (!employee)
            throw new app_exception_1.AppException('EMPLOYEE_NOT_FOUND', 'Employee not found.', common_1.HttpStatus.NOT_FOUND);
        return this.toPublicShape(employee, includeSalary);
    }
    async getEmployeeByUserId(userId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
            include: EMPLOYEE_INCLUDE,
        });
        if (!employee) {
            throw new app_exception_1.AppException('NO_EMPLOYEE_PROFILE', 'Your account has no employee profile yet.', common_1.HttpStatus.NOT_FOUND);
        }
        return this.toPublicShape(employee, true);
    }
    async findEmployeeIdByUserId(userId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
            select: { id: true },
        });
        return employee?.id ?? null;
    }
    async requireEmployeeExists(id) {
        const exists = await this.prisma.employee.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists)
            throw new app_exception_1.AppException('EMPLOYEE_NOT_FOUND', 'Employee not found.', common_1.HttpStatus.NOT_FOUND);
    }
    async updateEmployee(id, dto, includeSalary) {
        await this.requireEmployeeExists(id);
        const { salary, joiningDate, ...rest } = dto;
        const employee = await this.prisma.employee.update({
            where: { id },
            data: {
                ...rest,
                joiningDate: joiningDate ? new Date(joiningDate) : undefined,
                salaryEncrypted: salary !== undefined
                    ? this.encryption.encrypt(String(salary))
                    : undefined,
            },
            include: EMPLOYEE_INCLUDE,
        });
        return this.toPublicShape(employee, includeSalary);
    }
    async deactivateEmployee(id, includeSalary) {
        await this.requireEmployeeExists(id);
        const employee = await this.prisma.employee.update({
            where: { id },
            data: { status: 'TERMINATED' },
            include: EMPLOYEE_INCLUDE,
        });
        return this.toPublicShape(employee, includeSalary);
    }
    async getDecryptedSalary(id) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            select: { salaryEncrypted: true },
        });
        if (!employee)
            throw new app_exception_1.AppException('EMPLOYEE_NOT_FOUND', 'Employee not found.', common_1.HttpStatus.NOT_FOUND);
        return Number(this.encryption.decrypt(employee.salaryEncrypted));
    }
    async getHrSummary() {
        const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
        const [headcount, presentToday, pendingLeaveRequests] = await Promise.all([
            this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
            this.prisma.attendanceRecord.count({
                where: { date: todayUtc, checkInAt: { not: null } },
            }),
            this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        ]);
        return { headcount, presentToday, pendingLeaveRequests };
    }
    async getHrReport(dateFrom, dateTo) {
        const [headcount, attendanceByDate, leaveByTypeAndStatus] = await Promise.all([
            this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
            this.prisma.attendanceRecord.groupBy({
                by: ['date'],
                where: {
                    date: { gte: dateFrom, lte: dateTo },
                    checkInAt: { not: null },
                },
                _count: { _all: true },
                orderBy: { date: 'asc' },
            }),
            this.prisma.leaveRequest.groupBy({
                by: ['leaveType', 'status'],
                where: { startDate: { lte: dateTo }, endDate: { gte: dateFrom } },
                _count: { _all: true },
            }),
        ]);
        const dailyAttendance = attendanceByDate.map((row) => ({
            date: row.date.toISOString().slice(0, 10),
            present: row._count._all,
        }));
        const leaveByTypeMap = new Map();
        for (const row of leaveByTypeAndStatus) {
            const entry = leaveByTypeMap.get(row.leaveType) ?? {
                leaveType: row.leaveType,
                pending: 0,
                approved: 0,
                rejected: 0,
            };
            if (row.status === 'PENDING')
                entry.pending += row._count._all;
            else if (row.status === 'APPROVED')
                entry.approved += row._count._all;
            else if (row.status === 'REJECTED')
                entry.rejected += row._count._all;
            leaveByTypeMap.set(row.leaveType, entry);
        }
        const leaveByType = [...leaveByTypeMap.values()];
        const totalLeaveRequests = leaveByType.reduce((sum, row) => sum + row.pending + row.approved + row.rejected, 0);
        return {
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
            headcount,
            totalAttendanceDays: dailyAttendance.reduce((sum, d) => sum + d.present, 0),
            dailyAttendance,
            totalLeaveRequests,
            leaveByType,
        };
    }
    async resolveUserDisplayNames(userIds) {
        if (userIds.length === 0)
            return {};
        const employees = await this.prisma.employee.findMany({
            where: { userId: { in: userIds } },
            select: {
                userId: true,
                user: { select: { firstName: true, lastName: true } },
            },
        });
        return Object.fromEntries(employees.map((e) => [
            e.userId,
            `${e.user.firstName} ${e.user.lastName}`,
        ]));
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.FieldEncryptionService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map