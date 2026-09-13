import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TransactionsService } from '../../finance/services/transactions.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { AssetsService } from '../../assets/services/assets.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { RbacService } from '../../rbac/rbac.service';
import { CreatePurchaseRequestDto } from '../dto/create-purchase-request.dto';
import { MarkPurchasedDto } from '../dto/mark-purchased.dto';
import { ListPurchaseRequestsQueryDto } from '../dto/list-purchase-requests-query.dto';
export declare class PurchaseRequestsService {
    private readonly prisma;
    private readonly transactionsService;
    private readonly employeesService;
    private readonly assetsService;
    private readonly notificationsService;
    private readonly rbacService;
    constructor(prisma: PrismaService, transactionsService: TransactionsService, employeesService: EmployeesService, assetsService: AssetsService, notificationsService: NotificationsService, rbacService: RbacService);
    private toPublicShape;
    createRequest(requestedByUserId: string, dto: CreatePurchaseRequestDto): Promise<{
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
        estimatedCost: Prisma.Decimal;
        actualAmount: Prisma.Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
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
            estimatedCost: Prisma.Decimal;
            actualAmount: Prisma.Decimal | null;
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
    listMyRequests(requestedByUserId: string, query: PaginationQueryDto): Promise<{
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
            estimatedCost: Prisma.Decimal;
            actualAmount: Prisma.Decimal | null;
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
    private getRequestOrThrow;
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
        estimatedCost: Prisma.Decimal;
        actualAmount: Prisma.Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
    decide(id: string, decidedByUserId: string, approve: boolean): Promise<{
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
        estimatedCost: Prisma.Decimal;
        actualAmount: Prisma.Decimal | null;
        requestedByUserId: string;
        purchasedByUserId: string | null;
        purchasedAt: Date | null;
        linkedExpenseId: string | null;
        linkedAssetId: string | null;
    } & {
        estimatedCost: number;
        actualAmount: number | null;
    }>;
    markPurchased(id: string, purchasedByUserId: string, dto: MarkPurchasedDto): Promise<{
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
        estimatedCost: Prisma.Decimal;
        actualAmount: Prisma.Decimal | null;
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
