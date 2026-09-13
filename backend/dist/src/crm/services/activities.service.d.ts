import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { ListActivitiesQueryDto } from '../dto/list-activities-query.dto';
export declare class ActivitiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listActivities(query: ListActivitiesQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.ActivityType;
            subject: string;
            notes: string | null;
            customerId: string;
            occurredAt: Date;
            loggedByUserId: string | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createActivity(dto: CreateActivityDto, loggedByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.ActivityType;
        subject: string;
        notes: string | null;
        customerId: string;
        occurredAt: Date;
        loggedByUserId: string | null;
    }>;
}
