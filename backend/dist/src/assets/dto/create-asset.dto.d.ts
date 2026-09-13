import { AssetCategory } from '@prisma/client';
export declare class CreateAssetDto {
    name: string;
    category: AssetCategory;
    serialNumber?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    notes?: string;
}
