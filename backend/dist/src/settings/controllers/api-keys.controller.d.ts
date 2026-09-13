import { ApiKeysService } from '../services/api-keys.service';
import type { ApiKeyAuthenticatedRequest } from '../guards/api-key.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
export declare class ApiKeysController {
    private readonly apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    listKeys(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        keyPrefix: string;
        expiresAt: Date | null;
        revokedAt: Date | null;
        createdByUserId: string;
        label: string;
        lastUsedAt: Date | null;
    }[]>;
    createKey(dto: CreateApiKeyDto, user: AuthenticatedUser): Promise<{
        plaintextKey: string;
        id: string;
        label: string;
        keyPrefix: string;
        createdByUserId: string;
        lastUsedAt: Date | null;
        expiresAt: Date | null;
        revokedAt: Date | null;
        createdAt: Date;
    }>;
    revokeKey(id: string): Promise<{
        id: string;
        label: string;
        keyPrefix: string;
        createdByUserId: string;
        lastUsedAt: Date | null;
        expiresAt: Date | null;
        revokedAt: Date | null;
        createdAt: Date;
    }>;
    ping(request: ApiKeyAuthenticatedRequest): {
        ok: boolean;
        keyLabel: string | undefined;
    };
}
