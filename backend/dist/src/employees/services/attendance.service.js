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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const employees_service_1 = require("./employees.service");
function startOfUtcDay(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
let AttendanceService = class AttendanceService {
    prisma;
    employeesService;
    constructor(prisma, employeesService) {
        this.prisma = prisma;
        this.employeesService = employeesService;
    }
    async checkIn(employeeId) {
        await this.employeesService.requireEmployeeExists(employeeId);
        const date = startOfUtcDay();
        const existing = await this.prisma.attendanceRecord.findUnique({
            where: { employeeId_date: { employeeId, date } },
        });
        if (existing?.checkInAt) {
            throw new app_exception_1.AppException('ALREADY_CHECKED_IN', 'Already checked in today.', common_1.HttpStatus.CONFLICT);
        }
        if (existing) {
            return this.prisma.attendanceRecord.update({
                where: { id: existing.id },
                data: { checkInAt: new Date() },
            });
        }
        return this.prisma.attendanceRecord.create({
            data: { employeeId, date, checkInAt: new Date() },
        });
    }
    async checkOut(employeeId) {
        await this.employeesService.requireEmployeeExists(employeeId);
        const date = startOfUtcDay();
        const existing = await this.prisma.attendanceRecord.findUnique({
            where: { employeeId_date: { employeeId, date } },
        });
        if (!existing?.checkInAt) {
            throw new app_exception_1.AppException('NOT_CHECKED_IN', 'You must check in before checking out.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (existing.checkOutAt) {
            throw new app_exception_1.AppException('ALREADY_CHECKED_OUT', 'Already checked out today.', common_1.HttpStatus.CONFLICT);
        }
        return this.prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: { checkOutAt: new Date() },
        });
    }
    async getTodayRecord(employeeId) {
        const date = startOfUtcDay();
        return this.prisma.attendanceRecord.findUnique({
            where: { employeeId_date: { employeeId, date } },
        });
    }
    async listHistory(employeeId, query) {
        await this.employeesService.requireEmployeeExists(employeeId);
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.attendanceRecord.findMany({
                where: { employeeId },
                skip,
                take,
                orderBy: { date: 'desc' },
            }),
            this.prisma.attendanceRecord.count({ where: { employeeId } }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        employees_service_1.EmployeesService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map