import { PurchaseRequestCategory } from '@prisma/client';
export declare class CreatePurchaseRequestDto {
    description: string;
    category: PurchaseRequestCategory;
    estimatedCost: number;
    reason: string;
}
