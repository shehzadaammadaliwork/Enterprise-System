import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
export declare class ApiKeysService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    createKey(dto: CreateApiKeyDto, createdByUserId: string): Promise<{
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
    validateKey(plaintextKey: string): Promise<{
        id: string;
        createdAt: Date;
        keyPrefix: string;
        expiresAt: Date | null;
        revokedAt: Date | null;
        createdByUserId: string;
        label: string;
        keyHash: string;
        lastUsedAt: Date | null;
    } | null>;
    private getKeyOrThrow;
}
