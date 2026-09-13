"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const KEY_PREFIX = 'ent_live_';
const PREFIX_DISPLAY_LENGTH = 8;
function hashKey(plaintext) {
    return (0, crypto_1.createHash)('sha256').update(plaintext).digest('hex');
}
function toPublicKey(key) {
    return {
        id: key.id,
        label: key.label,
        keyPrefix: key.keyPrefix,
        createdByUserId: key.createdByUserId,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        revokedAt: key.revokedAt,
        createdAt: key.createdAt,
    };
}
let ApiKeysService = class ApiKeysService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listKeys() {
        return this.prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                label: true,
                keyPrefix: true,
                createdByUserId: true,
                lastUsedAt: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
            },
        });
    }
    async createKey(dto, createdByUserId) {
        const randomPart = (0, crypto_1.randomBytes)(32).toString('hex');
        const plaintextKey = `${KEY_PREFIX}${randomPart}`;
        const keyPrefix = `${KEY_PREFIX}${randomPart.slice(0, PREFIX_DISPLAY_LENGTH)}`;
        const record = await this.prisma.apiKey.create({
            data: {
                label: dto.label,
                keyPrefix,
                keyHash: hashKey(plaintextKey),
                createdByUserId,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
        });
        return { ...toPublicKey(record), plaintextKey };
    }
    async revokeKey(id) {
        const key = await this.getKeyOrThrow(id);
        if (key.revokedAt)
            return toPublicKey(key);
        const revoked = await this.prisma.apiKey.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
        return toPublicKey(revoked);
    }
    async validateKey(plaintextKey) {
        const key = await this.prisma.apiKey.findUnique({
            where: { keyHash: hashKey(plaintextKey) },
        });
        if (!key ||
            key.revokedAt ||
            (key.expiresAt && key.expiresAt < new Date())) {
            return null;
        }
        void this.prisma.apiKey
            .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
            .catch(() => {
        });
        return key;
    }
    async getKeyOrThrow(id) {
        const key = await this.prisma.apiKey.findUnique({ where: { id } });
        if (!key)
            throw new app_exception_1.AppException('API_KEY_NOT_FOUND', 'API key not found.', common_1.HttpStatus.NOT_FOUND);
        return key;
    }
};
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiKeysService);
//# sourceMappingURL=api-keys.service.js.map