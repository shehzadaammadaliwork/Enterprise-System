import { ActivityType } from '@prisma/client';
export declare class CreateActivityDto {
    customerId: string;
    type: ActivityType;
    subject: string;
    notes?: string;
    occurredAt: string;
}
