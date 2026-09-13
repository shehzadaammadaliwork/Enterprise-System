import { AssetCategory } from '@prisma/client';
export declare class UpdateAssetDto {
    name?: string;
    category?: AssetCategory;
    serialNumber?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    notes?: string;
}
