export declare class PayrollAdjustmentInputDto {
    employeeId: string;
    bonus?: number;
    deduction?: number;
}
export declare class SetPayrollAdjustmentsDto {
    month: number;
    year: number;
    adjustments: PayrollAdjustmentInputDto[];
}
