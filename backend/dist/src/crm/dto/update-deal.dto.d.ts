import { DealStage } from '@prisma/client';
export declare class UpdateDealDto {
    title?: string;
    customerId?: string;
    value?: number;
    stage?: DealStage;
    expectedCloseDate?: string;
    assignedToUserId?: string;
}
