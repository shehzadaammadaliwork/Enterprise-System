import { LeadSource, LeadStatus } from '@prisma/client';
export declare class UpdateLeadDto {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    source?: LeadSource;
    status?: LeadStatus;
    assignedToUserId?: string;
}
