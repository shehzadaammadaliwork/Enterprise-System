import { LeadsService } from '../services/leads.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
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
    createLead(dto: CreateLeadDto): import("@prisma/client").Prisma.Prisma__LeadClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
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
