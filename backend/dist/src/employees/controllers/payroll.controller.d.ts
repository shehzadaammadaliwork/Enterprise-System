import { PayrollService } from '../services/payroll.service';
import { EmployeesService } from '../services/employees.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TriggerPayrollRunDto } from '../dto/trigger-payroll-run.dto';
import { SetPayrollAdjustmentsDto } from '../dto/set-payroll-adjustments.dto';
import { ListPayrollAdjustmentsQueryDto } from '../dto/list-payroll-adjustments-query.dto';
export declare class PayrollController {
    private readonly payrollService;
    private readonly employeesService;
    constructor(payrollService: PayrollService, employeesService: EmployeesService);
    getMyPayslips(user: AuthenticatedUser, query: PaginationQueryDto): Promise<{
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
    getAdjustments(query: ListPayrollAdjustmentsQueryDto): Promise<{
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
    setAdjustments(user: AuthenticatedUser, dto: SetPayrollAdjustmentsDto): Promise<{
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
    triggerRun(user: AuthenticatedUser, dto: TriggerPayrollRunDto): Promise<{
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
}
