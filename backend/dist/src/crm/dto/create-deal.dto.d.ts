import { DealStage } from '@prisma/client';
export declare class CreateDealDto {
    title: string;
    customerId: string;
    value?: number;
    stage?: DealStage;
    expectedCloseDate?: string;
    assignedToUserId?: string;
}
