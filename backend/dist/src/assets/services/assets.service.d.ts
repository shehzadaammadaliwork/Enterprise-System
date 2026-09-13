import { AssetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ChangeAssetStatusDto } from '../dto/change-asset-status.dto';
import { ListAssetsQueryDto } from '../dto/list-assets-query.dto';
export declare function isValidAssetStatusTransition(from: AssetStatus, to: AssetStatus): boolean;
export interface CreateAssetFromPurchaseInput {
    name: string;
    purchaseCost: number;
    purchaseRequestId: string;
    assignedEmployeeId?: string;
}
export declare class AssetsService {
    private readonly prisma;
    private readonly employeesService;
    constructor(prisma: PrismaService, employeesService: EmployeesService);
    private toPublicShape;
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
            purchaseCost: Prisma.Decimal | null;
            assignedEmployeeId: string | null;
            retirementReason: string | null;
            purchaseRequestId: string | null;
        } & {
            purchaseCost: number | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    private getAssetOrThrow;
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
        purchaseCost: Prisma.Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
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
        purchaseCost: Prisma.Decimal | null;
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
        purchaseCost: Prisma.Decimal | null;
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
        purchaseCost: Prisma.Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
    }>;
    deleteAsset(id: string): Promise<void>;
    createFromPurchase(input: CreateAssetFromPurchaseInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        notes: string | null;
        category: import("@prisma/client").$Enums.AssetCategory;
        serialNumber: string | null;
        purchaseDate: Date | null;
        purchaseCost: Prisma.Decimal | null;
        assignedEmployeeId: string | null;
        retirementReason: string | null;
        purchaseRequestId: string | null;
    } & {
        purchaseCost: number | null;
    }>;
}
