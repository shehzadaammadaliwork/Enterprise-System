import { ActivitiesService } from '../services/activities.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { ListActivitiesQueryDto } from '../dto/list-activities-query.dto';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
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
    createActivity(user: AuthenticatedUser, dto: CreateActivityDto): Promise<{
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
