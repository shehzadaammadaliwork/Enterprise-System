import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    list(query: ListAuditLogsQueryDto): Promise<{
        items: {
            path: string | null;
            id: string;
            module: string;
            action: import("@prisma/client").$Enums.AuditAction;
            createdAt: Date;
            userEmail: string | null;
            entityType: string;
            entityId: string | null;
            before: import("@prisma/client/runtime/library").JsonValue | null;
            after: import("@prisma/client/runtime/library").JsonValue | null;
            ip: string | null;
            method: string | null;
            userId: string | null;
        }[];
        meta: import("../common/pagination/pagination.dto").PaginationMeta;
    }>;
    listModules(): Promise<string[]>;
    get(id: string): Promise<{
        path: string | null;
        id: string;
        module: string;
        action: import("@prisma/client").$Enums.AuditAction;
        createdAt: Date;
        userEmail: string | null;
        entityType: string;
        entityId: string | null;
        before: import("@prisma/client/runtime/library").JsonValue | null;
        after: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
        method: string | null;
        userId: string | null;
    }>;
}
