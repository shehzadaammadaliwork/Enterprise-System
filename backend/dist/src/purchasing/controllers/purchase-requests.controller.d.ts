import { PurchaseRequestsService } from '../services/purchase-requests.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreatePurchaseRequestDto } from '../dto/create-purchase-request.dto';
import { MarkPurchasedDto } from '../dto/mark-purchased.dto';
import { ListPurchaseRequestsQueryDto } from '../dto/list-purchase-requests-query.dto';
export declare class PurchaseRequestsController {
    private readonly purchaseRequestsService;
    constructor(purchaseRequestsService: PurchaseRequestsService);
    createRequest(user: AuthenticatedUser, dto: CreatePurchaseRequestDto): Promise<{
        number: number;
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        category: import("@prisma/client").$Enums.PurchaseRequestCategory;
        estimatedCost: import("@prisma/client/runtime/library").Decimal;
        actualAmount: import("@prisma/client/runtime/library").Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
    getMyRequests(user: AuthenticatedUser, query: PaginationQueryDto): Promise<{
        items: ({
            number: number;
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PurchaseRequestStatus;
            reason: string;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            category: import("@prisma/client").$Enums.PurchaseRequestCategory;
            estimatedCost: import("@prisma/client/runtime/library").Decimal;
            actualAmount: import("@prisma/client/runtime/library").Decimal | null;
            requestedByUserId: string;
            purchasedByUserId: string | null;
            purchasedAt: Date | null;
            linkedExpenseId: string | null;
            linkedAssetId: string | null;
        } & {
            estimatedCost: number;
            actualAmount: number | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    listRequests(query: ListPurchaseRequestsQueryDto): Promise<{
        items: ({
            number: number;
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PurchaseRequestStatus;
            reason: string;
            decidedByUserId: string | null;
            decidedAt: Date | null;
            category: import("@prisma/client").$Enums.PurchaseRequestCategory;
            estimatedCost: import("@prisma/client/runtime/library").Decimal;
            actualAmount: import("@prisma/client/runtime/library").Decimal | null;
            requestedByUserId: string;
            purchasedByUserId: string | null;
            purchasedAt: Date | null;
            linkedExpenseId: string | null;
            linkedAssetId: string | null;
        } & {
            estimatedCost: number;
            actualAmount: number | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getRequest(id: string): Promise<{
        number: number;
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        category: import("@prisma/client").$Enums.PurchaseRequestCategory;
        estimatedCost: import("@prisma/client/runtime/library").Decimal;
        actualAmount: import("@prisma/client/runtime/library").Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
    approve(id: string, user: AuthenticatedUser): Promise<{
        number: number;
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        category: import("@prisma/client").$Enums.PurchaseRequestCategory;
        estimatedCost: import("@prisma/client/runtime/library").Decimal;
        actualAmount: import("@prisma/client/runtime/library").Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
    reject(id: string, user: AuthenticatedUser): Promise<{
        number: number;
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        category: import("@prisma/client").$Enums.PurchaseRequestCategory;
        estimatedCost: import("@prisma/client/runtime/library").Decimal;
        actualAmount: import("@prisma/client/runtime/library").Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
    markPurchased(id: string, user: AuthenticatedUser, dto: MarkPurchasedDto): Promise<{
        number: number;
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseRequestStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        category: import("@prisma/client").$Enums.PurchaseRequestCategory;
        estimatedCost: import("@prisma/client/runtime/library").Decimal;
        actualAmount: import("@prisma/client/runtime/library").Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
}
