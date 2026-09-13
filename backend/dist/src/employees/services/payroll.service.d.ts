import { Queue } from 'bullmq';
import { PayrollRunScope } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FieldEncryptionService } from '../../common/security/encryption.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
import { EventsGateway } from '../../common/websocket/events.gateway';
import { SetPayrollAdjustmentsDto } from '../dto/set-payroll-adjustments.dto';
export declare const PAYROLL_QUEUE = "payroll";
export declare class PayrollService {
    private readonly prisma;
    private readonly encryption;
    private readonly employeesService;
    private readonly eventsGateway;
    private readonly payrollQueue;
    private readonly logger;
    constructor(prisma: PrismaService, encryption: FieldEncryptionService, employeesService: EmployeesService, eventsGateway: EventsGateway, payrollQueue: Queue);
    private getEmployeeIdsWithPayrollRecord;
    triggerRun(month: number, year: number, triggeredByUserId: string, scope?: PayrollRunScope, employeeIds?: string[]): Promise<{
        skippedEmployeeIds: string[];
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        year: number;
        month: number;
        scope: import("@prisma/client").$Enums.PayrollRunScope;
        selectedEmployeeIds: string[];
        triggeredByUserId: string;
        errorMessage: string | null;
        completedAt: Date | null;
    }>;
    listRuns(query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.PayrollRunStatus;
            year: number;
            month: number;
            scope: import("@prisma/client").$Enums.PayrollRunScope;
            selectedEmployeeIds: string[];
            triggeredByUserId: string;
            errorMessage: string | null;
            completedAt: Date | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getRun(id: string): Promise<{
        payslips: (Omit<{
            employee: {
                id: string;
                user: {
                    email: string;
                    firstName: string;
                    lastName: string;
                };
                designation: string;
            };
        } & {
            id: string;
            createdAt: Date;
            employeeId: string;
            payrollRunId: string;
            grossEncrypted: string;
            bonusEncrypted: string | null;
            deductionsEncrypted: string | null;
            adjustmentDeductionEncrypted: string | null;
            netEncrypted: string;
        }, "grossEncrypted" | "bonusEncrypted" | "deductionsEncrypted" | "adjustmentDeductionEncrypted" | "netEncrypted"> & {
            basePay: number;
            bonus: number;
            deduction: number;
            net: number;
        })[];
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        year: number;
        month: number;
        scope: import("@prisma/client").$Enums.PayrollRunScope;
        selectedEmployeeIds: string[];
        triggeredByUserId: string;
        errorMessage: string | null;
        completedAt: Date | null;
    }>;
    getPayslipsForEmployee(employeeId: string, query: PaginationQueryDto): Promise<{
        items: (Omit<{
            payrollRun: {
                id: string;
                createdAt: Date;
                status: import("@prisma/client").$Enums.PayrollRunStatus;
                year: number;
                month: number;
                scope: import("@prisma/client").$Enums.PayrollRunScope;
                selectedEmployeeIds: string[];
                triggeredByUserId: string;
                errorMessage: string | null;
                completedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            employeeId: string;
            payrollRunId: string;
            grossEncrypted: string;
            bonusEncrypted: string | null;
            deductionsEncrypted: string | null;
            adjustmentDeductionEncrypted: string | null;
            netEncrypted: string;
        }, "grossEncrypted" | "bonusEncrypted" | "deductionsEncrypted" | "adjustmentDeductionEncrypted" | "netEncrypted"> & {
            basePay: number;
            bonus: number;
            deduction: number;
            net: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    private isPeriodLocked;
    getAdjustments(month: number, year: number, employeeIds?: string[]): Promise<{
        locked: boolean;
        items: {
            employeeId: string;
            designation: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            basePay: number;
            bonus: number;
            deduction: number;
        }[];
    }>;
    setAdjustments(dto: SetPayrollAdjustmentsDto, userId: string): Promise<{
        locked: boolean;
        items: {
            employeeId: string;
            designation: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            basePay: number;
            bonus: number;
            deduction: number;
        }[];
    }>;
    private toPublicPayslip;
    processRun(runId: string): Promise<void>;
}
