import { PayrollRunScope } from '@prisma/client';
export declare class TriggerPayrollRunDto {
    month: number;
    year: number;
    scope?: PayrollRunScope;
    employeeIds?: string[];
}
