import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
export declare class AuditLogsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listAuditLogs(query: ListAuditLogsQueryDto): Promise<{
        items: {
            path: string | null;
            id: string;
            module: string;
            action: import("@prisma/client").$Enums.AuditAction;
            createdAt: Date;
            userEmail: string | null;
            entityType: string;
            entityId: string | null;
            before: Prisma.JsonValue | null;
            after: Prisma.JsonValue | null;
            ip: string | null;
            method: string | null;
            userId: string | null;
        }[];
        meta: import("../common/pagination/pagination.dto").PaginationMeta;
    }>;
    listDistinctModules(): Promise<string[]>;
    getAuditLog(id: string): Promise<{
        path: string | null;
        id: string;
        module: string;
        action: import("@prisma/client").$Enums.AuditAction;
        createdAt: Date;
        userEmail: string | null;
        entityType: string;
        entityId: string | null;
        before: Prisma.JsonValue | null;
        after: Prisma.JsonValue | null;
        ip: string | null;
        method: string | null;
        userId: string | null;
    }>;
}
