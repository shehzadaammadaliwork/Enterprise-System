import { DealsService } from '../services/deals.service';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';
export declare class DealsController {
    private readonly dealsService;
    constructor(dealsService: DealsService);
    listDeals(query: ListDealsQueryDto): Promise<{
        items: ({
            customer: {
                id: string;
                companyName: string;
                contactName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal | null;
            assignedToUserId: string | null;
            customerId: string;
            stage: import("@prisma/client").$Enums.DealStage;
            expectedCloseDate: Date | null;
        } & {
            value: number | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createDeal(dto: CreateDealDto): Promise<{
        customer: {
            id: string;
            companyName: string;
            contactName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        assignedToUserId: string | null;
        customerId: string;
        stage: import("@prisma/client").$Enums.DealStage;
        expectedCloseDate: Date | null;
    } & {
        value: number | null;
    }>;
    getDeal(id: string): Promise<{
        customer: {
            id: string;
            companyName: string;
            contactName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        assignedToUserId: string | null;
        customerId: string;
        stage: import("@prisma/client").$Enums.DealStage;
        expectedCloseDate: Date | null;
    } & {
        value: number | null;
    }>;
    updateDeal(id: string, dto: UpdateDealDto): Promise<{
        customer: {
            id: string;
            companyName: string;
            contactName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        assignedToUserId: string | null;
        customerId: string;
        stage: import("@prisma/client").$Enums.DealStage;
        expectedCloseDate: Date | null;
    } & {
        value: number | null;
    }>;
    deleteDeal(id: string): Promise<void>;
}
