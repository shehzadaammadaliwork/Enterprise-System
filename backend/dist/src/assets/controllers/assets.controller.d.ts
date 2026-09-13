import { AssetsService } from '../services/assets.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ChangeAssetStatusDto } from '../dto/change-asset-status.dto';
import { ListAssetsQueryDto } from '../dto/list-assets-query.dto';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    listAssets(query: ListAssetsQueryDto): Promise<{
        items: ({
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.AssetStatus;
            notes: string | null;
            category: import("@prisma/client").$Enums.AssetCategory;
            serialNumber: string | null;
            purchaseDate: Date | null;
            purchaseCost: import("@prisma/client/runtime/library").Decimal | null;
            assignedEmployeeId: string | null;
            retirementReason: string | null;
            purchaseRequestId: string | null;
        } & {
            purchaseCost: number | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createAsset(dto: CreateAssetDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        notes: string | null;
        category: import("@prisma/client").$Enums.AssetCategory;
        serialNumber: string | null;
        purchaseDate: Date | null;
        purchaseCost: import("@prisma/client/runtime/library").Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
    }>;
    getAsset(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        notes: string | null;
        category: import("@prisma/client").$Enums.AssetCategory;
        serialNumber: string | null;
        purchaseDate: Date | null;
        purchaseCost: import("@prisma/client/runtime/library").Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
    }>;
    updateAsset(id: string, dto: UpdateAssetDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        notes: string | null;
        category: import("@prisma/client").$Enums.AssetCategory;
        serialNumber: string | null;
        purchaseDate: Date | null;
        purchaseCost: import("@prisma/client/runtime/library").Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
    }>;
    changeStatus(id: string, dto: ChangeAssetStatusDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        notes: string | null;
        category: import("@prisma/client").$Enums.AssetCategory;
        serialNumber: string | null;
        purchaseDate: Date | null;
        purchaseCost: import("@prisma/client/runtime/library").Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
    }>;
    deleteAsset(id: string): Promise<void>;
}
