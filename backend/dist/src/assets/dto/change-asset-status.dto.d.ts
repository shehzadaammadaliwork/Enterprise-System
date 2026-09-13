import { AssetStatus } from '@prisma/client';
export declare class ChangeAssetStatusDto {
    status: AssetStatus;
    assignedEmployeeId?: string;
    retirementReason?: string;
}
