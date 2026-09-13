import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';
export declare class DealsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toPublicShape;
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
            value: Prisma.Decimal | null;
            assignedToUserId: string | null;
            customerId: string;
            stage: import("@prisma/client").$Enums.DealStage;
            expectedCloseDate: Date | null;
        } & {
            value: number | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
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
        value: Prisma.Decimal | null;
        assignedToUserId: string | null;
        customerId: string;
        stage: import("@prisma/client").$Enums.DealStage;
        expectedCloseDate: Date | null;
    } & {
        value: number | null;
    }>;
    private requireCustomerExists;
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
        value: Prisma.Decimal | null;
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
        value: Prisma.Decimal | null;
        assignedToUserId: string | null;
        customerId: string;
        stage: import("@prisma/client").$Enums.DealStage;
        expectedCloseDate: Date | null;
    } & {
        value: number | null;
    }>;
    deleteDeal(id: string): Promise<void>;
    getPipelineSummary(): Promise<{
        openDealCount: number;
        openPipelineValue: number;
    }>;
    getPerformanceReport(dateFrom: Date, dateTo: Date, assignedToUserId?: string): Promise<{
        winRate: number;
        byRep: {
            winRate: number;
            assignedToUserId: string | null;
            totalDeals: number;
            wonDeals: number;
            lostDeals: number;
            openDeals: number;
            wonValue: number;
        }[];
        totalDeals: number;
        wonDeals: number;
        lostDeals: number;
        openDeals: number;
        wonValue: number;
        dateFrom: string;
        dateTo: string;
    }>;
}
