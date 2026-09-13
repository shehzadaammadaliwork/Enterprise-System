import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
export declare class LeadsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listLeads(query: ListLeadsQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            status: import("@prisma/client").$Enums.LeadStatus;
            phone: string | null;
            companyName: string;
            contactName: string;
            source: import("@prisma/client").$Enums.LeadSource;
            assignedToUserId: string | null;
            convertedToCustomerId: string | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getLead(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        status: import("@prisma/client").$Enums.LeadStatus;
        phone: string | null;
        companyName: string;
        contactName: string;
        source: import("@prisma/client").$Enums.LeadSource;
        assignedToUserId: string | null;
        convertedToCustomerId: string | null;
    }>;
    createLead(dto: CreateLeadDto): Prisma.Prisma__LeadClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        status: import("@prisma/client").$Enums.LeadStatus;
        phone: string | null;
        companyName: string;
        contactName: string;
        source: import("@prisma/client").$Enums.LeadSource;
        assignedToUserId: string | null;
        convertedToCustomerId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateLead(id: string, dto: UpdateLeadDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        status: import("@prisma/client").$Enums.LeadStatus;
        phone: string | null;
        companyName: string;
        contactName: string;
        source: import("@prisma/client").$Enums.LeadSource;
        assignedToUserId: string | null;
        convertedToCustomerId: string | null;
    }>;
    deleteLead(id: string): Promise<void>;
    convertLead(id: string): Promise<{
        lead: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            status: import("@prisma/client").$Enums.LeadStatus;
            phone: string | null;
            companyName: string;
            contactName: string;
            source: import("@prisma/client").$Enums.LeadSource;
            assignedToUserId: string | null;
            convertedToCustomerId: string | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            addressLine1: string | null;
            city: string | null;
            country: string | null;
            phone: string | null;
            companyName: string;
            contactName: string;
        };
    }>;
}
