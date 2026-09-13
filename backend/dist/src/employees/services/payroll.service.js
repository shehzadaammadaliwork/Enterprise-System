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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PayrollService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = exports.PAYROLL_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const encryption_service_1 = require("../../common/security/encryption.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const employees_service_1 = require("./employees.service");
const events_gateway_1 = require("../../common/websocket/events.gateway");
exports.PAYROLL_QUEUE = 'payroll';
let PayrollService = PayrollService_1 = class PayrollService {
    prisma;
    encryption;
    employeesService;
    eventsGateway;
    payrollQueue;
    logger = new common_1.Logger(PayrollService_1.name);
    constructor(prisma, encryption, employeesService, eventsGateway, payrollQueue) {
        this.prisma = prisma;
        this.encryption = encryption;
        this.employeesService = employeesService;
        this.eventsGateway = eventsGateway;
        this.payrollQueue = payrollQueue;
    }
    async getEmployeeIdsWithPayrollRecord(month, year, employeeIds) {
        if (employeeIds.length === 0)
            return new Set();
        const items = await this.prisma.payslipItem.findMany({
            where: {
                employeeId: { in: employeeIds },
                payrollRun: {
                    month,
                    year,
                    status: {
                        in: [client_1.PayrollRunStatus.PROCESSING, client_1.PayrollRunStatus.COMPLETED],
                    },
                },
            },
            select: { employeeId: true },
        });
        return new Set(items.map((item) => item.employeeId));
    }
    async triggerRun(month, year, triggeredByUserId, scope = client_1.PayrollRunScope.ALL_ACTIVE, employeeIds) {
        let requestedIds;
        if (scope === client_1.PayrollRunScope.SELECTED) {
            const ids = [...new Set(employeeIds ?? [])];
            const matched = await this.prisma.employee.count({
                where: { id: { in: ids } },
            });
            if (matched !== ids.length) {
                throw new app_exception_1.AppException('INVALID_EMPLOYEE_SELECTION', 'One or more selected employees could not be found.', common_1.HttpStatus.BAD_REQUEST);
            }
            requestedIds = ids;
        }
        else {
            const activeEmployees = await this.prisma.employee.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true },
            });
            requestedIds = activeEmployees.map((employee) => employee.id);
        }
        const alreadyCoveredIds = await this.getEmployeeIdsWithPayrollRecord(month, year, requestedIds);
        const remainingIds = requestedIds.filter((id) => !alreadyCoveredIds.has(id));
        const skippedEmployeeIds = requestedIds.filter((id) => alreadyCoveredIds.has(id));
        if (remainingIds.length === 0) {
            throw new app_exception_1.AppException('PAYROLL_RUN_EXISTS', `A payroll run for ${month}/${year} already exists.`, common_1.HttpStatus.CONFLICT);
        }
        const runScope = scope === client_1.PayrollRunScope.SELECTED || skippedEmployeeIds.length > 0
            ? client_1.PayrollRunScope.SELECTED
            : client_1.PayrollRunScope.ALL_ACTIVE;
        const runSelectedEmployeeIds = runScope === client_1.PayrollRunScope.SELECTED ? remainingIds : [];
        const run = await this.prisma.payrollRun.create({
            data: {
                month,
                year,
                triggeredByUserId,
                scope: runScope,
                selectedEmployeeIds: runSelectedEmployeeIds,
            },
        });
        await this.payrollQueue.add('generate', { runId: run.id }, { jobId: run.id });
        return { ...run, skippedEmployeeIds };
    }
    async listRuns(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.payrollRun.findMany({
                skip,
                take,
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
            }),
            this.prisma.payrollRun.count(),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getRun(id) {
        const run = await this.prisma.payrollRun.findUnique({
            where: { id },
            include: {
                payslips: {
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
                },
            },
        });
        if (!run)
            throw new app_exception_1.AppException('PAYROLL_RUN_NOT_FOUND', 'Payroll run not found.', common_1.HttpStatus.NOT_FOUND);
        return {
            ...run,
            payslips: run.payslips.map((p) => this.toPublicPayslip(p)),
        };
    }
    async getPayslipsForEmployee(employeeId, query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = { employeeId };
        const [items, total] = await Promise.all([
            this.prisma.payslipItem.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { payrollRun: true },
            }),
            this.prisma.payslipItem.count({ where }),
        ]);
        return {
            items: items.map((p) => this.toPublicPayslip(p)),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async isPeriodLocked(month, year) {
        const run = await this.prisma.payrollRun.findFirst({
            where: {
                month,
                year,
                status: {
                    in: [client_1.PayrollRunStatus.PROCESSING, client_1.PayrollRunStatus.COMPLETED],
                },
            },
            select: { id: true },
        });
        return !!run;
    }
    async getAdjustments(month, year, employeeIds) {
        const locked = await this.isPeriodLocked(month, year);
        const employees = await this.prisma.employee.findMany({
            where: {
                status: 'ACTIVE',
                ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
            },
            select: {
                id: true,
                designation: true,
                salaryEncrypted: true,
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const existingAdjustments = await this.prisma.payrollAdjustment.findMany({
            where: {
                month,
                year,
                employeeId: { in: employees.map((e) => e.id) },
            },
        });
        const adjustmentByEmployeeId = new Map(existingAdjustments.map((a) => [a.employeeId, a]));
        const items = employees.map((employee) => {
            const adjustment = adjustmentByEmployeeId.get(employee.id);
            return {
                employeeId: employee.id,
                designation: employee.designation,
                user: employee.user,
                basePay: Number(this.encryption.decrypt(employee.salaryEncrypted)),
                bonus: adjustment
                    ? Number(this.encryption.decrypt(adjustment.bonusEncrypted))
                    : 0,
                deduction: adjustment
                    ? Number(this.encryption.decrypt(adjustment.deductionEncrypted))
                    : 0,
            };
        });
        return { locked, items };
    }
    async setAdjustments(dto, userId) {
        const { month, year, adjustments } = dto;
        if (await this.isPeriodLocked(month, year)) {
            throw new app_exception_1.AppException('PAYROLL_PERIOD_LOCKED', `Payroll for ${month}/${year} has already been run — its adjustments are locked.`, common_1.HttpStatus.CONFLICT);
        }
        const ids = adjustments.map((a) => a.employeeId);
        const matched = await this.prisma.employee.count({
            where: { id: { in: ids } },
        });
        if (matched !== new Set(ids).size) {
            throw new app_exception_1.AppException('INVALID_EMPLOYEE_SELECTION', 'One or more employees could not be found.', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.prisma.$transaction(adjustments.map((adjustment) => this.prisma.payrollAdjustment.upsert({
            where: {
                month_year_employeeId: {
                    month,
                    year,
                    employeeId: adjustment.employeeId,
                },
            },
            update: {
                bonusEncrypted: this.encryption.encrypt(String(adjustment.bonus ?? 0)),
                deductionEncrypted: this.encryption.encrypt(String(adjustment.deduction ?? 0)),
                updatedByUserId: userId,
            },
            create: {
                month,
                year,
                employeeId: adjustment.employeeId,
                bonusEncrypted: this.encryption.encrypt(String(adjustment.bonus ?? 0)),
                deductionEncrypted: this.encryption.encrypt(String(adjustment.deduction ?? 0)),
                createdByUserId: userId,
            },
        })));
        return this.getAdjustments(month, year, ids);
    }
    toPublicPayslip(payslip) {
        const { grossEncrypted, bonusEncrypted, deductionsEncrypted, adjustmentDeductionEncrypted, netEncrypted, ...rest } = payslip;
        void deductionsEncrypted;
        return {
            ...rest,
            basePay: Number(this.encryption.decrypt(grossEncrypted)),
            bonus: bonusEncrypted
                ? Number(this.encryption.decrypt(bonusEncrypted))
                : 0,
            deduction: adjustmentDeductionEncrypted
                ? Number(this.encryption.decrypt(adjustmentDeductionEncrypted))
                : 0,
            net: Number(this.encryption.decrypt(netEncrypted)),
        };
    }
    async processRun(runId) {
        const run = await this.prisma.payrollRun.findUniqueOrThrow({
            where: { id: runId },
        });
        await this.prisma.payrollRun.update({
            where: { id: runId },
            data: { status: client_1.PayrollRunStatus.PROCESSING },
        });
        try {
            const targetEmployees = await this.prisma.employee.findMany({
                where: run.scope === client_1.PayrollRunScope.SELECTED
                    ? { id: { in: run.selectedEmployeeIds }, status: 'ACTIVE' }
                    : { status: 'ACTIVE' },
                select: { id: true },
            });
            const adjustments = await this.prisma.payrollAdjustment.findMany({
                where: {
                    month: run.month,
                    year: run.year,
                    employeeId: { in: targetEmployees.map((e) => e.id) },
                },
            });
            const adjustmentByEmployeeId = new Map(adjustments.map((a) => [a.employeeId, a]));
            for (const { id: employeeId } of targetEmployees) {
                const gross = await this.employeesService.getDecryptedSalary(employeeId);
                const adjustment = adjustmentByEmployeeId.get(employeeId);
                const bonus = adjustment
                    ? Number(this.encryption.decrypt(adjustment.bonusEncrypted))
                    : 0;
                const deduction = adjustment
                    ? Number(this.encryption.decrypt(adjustment.deductionEncrypted))
                    : 0;
                const net = Math.round((gross + bonus - deduction) * 100) / 100;
                await this.prisma.payslipItem.upsert({
                    where: {
                        payrollRunId_employeeId: { payrollRunId: runId, employeeId },
                    },
                    update: {
                        grossEncrypted: this.encryption.encrypt(String(gross)),
                        bonusEncrypted: this.encryption.encrypt(String(bonus)),
                        adjustmentDeductionEncrypted: this.encryption.encrypt(String(deduction)),
                        netEncrypted: this.encryption.encrypt(String(net)),
                    },
                    create: {
                        payrollRunId: runId,
                        employeeId,
                        grossEncrypted: this.encryption.encrypt(String(gross)),
                        bonusEncrypted: this.encryption.encrypt(String(bonus)),
                        adjustmentDeductionEncrypted: this.encryption.encrypt(String(deduction)),
                        netEncrypted: this.encryption.encrypt(String(net)),
                    },
                });
            }
            await this.prisma.payrollRun.update({
                where: { id: runId },
                data: { status: client_1.PayrollRunStatus.COMPLETED, completedAt: new Date() },
            });
            this.eventsGateway.emitToUser(run.triggeredByUserId, 'payroll:completed', {
                runId,
                month: run.month,
                year: run.year,
                employeeCount: targetEmployees.length,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Payroll run ${runId} failed: ${message}`);
            await this.prisma.payrollRun.update({
                where: { id: runId },
                data: { status: client_1.PayrollRunStatus.FAILED, errorMessage: message },
            });
            this.eventsGateway.emitToUser(run.triggeredByUserId, 'payroll:failed', {
                runId,
                month: run.month,
                year: run.year,
                message,
            });
            throw error;
        }
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = PayrollService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)(exports.PAYROLL_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.FieldEncryptionService,
        employees_service_1.EmployeesService,
        events_gateway_1.EventsGateway,
        bullmq_2.Queue])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map