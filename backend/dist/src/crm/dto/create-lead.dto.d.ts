import { LeadSource } from '@prisma/client';
export declare class CreateLeadDto {
    companyName: string;
    contactName: string;
    email?: string;
    phone?: string;
    source?: LeadSource;
    assignedToUserId?: string;
}
