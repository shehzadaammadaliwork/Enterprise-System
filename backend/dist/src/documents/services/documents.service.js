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
exports.DocumentsService = exports.MAX_DOCUMENT_SIZE_BYTES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const storage_service_1 = require("../../common/storage/storage.service");
const rbac_service_1 = require("../../rbac/rbac.service");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip',
];
exports.MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;
const DOCUMENT_INCLUDE = { accessGrants: true };
let DocumentsService = class DocumentsService {
    prisma;
    storageService;
    rbacService;
    constructor(prisma, storageService, rbacService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.rbacService = rbacService;
    }
    async canAccess(document, userId) {
        if (document.accessScope === client_1.DocumentAccessScope.EVERYONE)
            return true;
        if (document.accessScope === client_1.DocumentAccessScope.SPECIFIC_USERS) {
            return document.accessGrants.some((g) => g.userId === userId);
        }
        const grantedRoleIds = new Set(document.accessGrants.map((g) => g.roleId).filter(Boolean));
        const userRoles = await this.rbacService.getUserRoles(userId);
        return userRoles.some((ur) => grantedRoleIds.has(ur.roleId));
    }
    async getDocumentOrThrow(id) {
        const document = await this.prisma.document.findUnique({
            where: { id },
            include: DOCUMENT_INCLUDE,
        });
        if (!document)
            throw new app_exception_1.AppException('DOCUMENT_NOT_FOUND', 'Document not found.', common_1.HttpStatus.NOT_FOUND);
        return document;
    }
    async requireAccess(document, userId) {
        if (!(await this.canAccess(document, userId))) {
            throw new app_exception_1.AppException('DOCUMENT_ACCESS_DENIED', 'You do not have access to this document.', common_1.HttpStatus.FORBIDDEN);
        }
    }
    async uploadDocument(dto, file, uploadedByUserId) {
        const stored = await this.storageService.save({
            folder: `documents/${dto.entityType}/${dto.entityId}`,
            fileName: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
            allowedMimeTypes: ALLOWED_MIME_TYPES,
            maxSizeBytes: exports.MAX_DOCUMENT_SIZE_BYTES,
        });
        const document = await this.prisma.document.create({
            data: {
                entityType: dto.entityType,
                entityId: dto.entityId,
                title: dto.title,
                uploadedByUserId,
                versions: {
                    create: {
                        versionNumber: 1,
                        storageKey: stored.key,
                        originalFileName: stored.originalName,
                        mimeType: stored.mimeType,
                        sizeBytes: stored.sizeBytes,
                        checksum: stored.checksum,
                        uploadedByUserId,
                    },
                },
            },
            include: { ...DOCUMENT_INCLUDE, versions: true },
        });
        return document;
    }
    async addVersion(documentId, file, uploadedByUserId) {
        const document = await this.getDocumentOrThrow(documentId);
        const stored = await this.storageService.save({
            folder: `documents/${document.entityType}/${document.entityId}`,
            fileName: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
            allowedMimeTypes: ALLOWED_MIME_TYPES,
            maxSizeBytes: exports.MAX_DOCUMENT_SIZE_BYTES,
        });
        const latest = await this.prisma.documentVersion.findFirst({
            where: { documentId },
            orderBy: { versionNumber: 'desc' },
        });
        const version = await this.prisma.documentVersion.create({
            data: {
                documentId,
                versionNumber: (latest?.versionNumber ?? 0) + 1,
                storageKey: stored.key,
                originalFileName: stored.originalName,
                mimeType: stored.mimeType,
                sizeBytes: stored.sizeBytes,
                checksum: stored.checksum,
                uploadedByUserId,
            },
        });
        await this.prisma.document.update({
            where: { id: documentId },
            data: { updatedAt: new Date() },
        });
        return version;
    }
    async listForEntity(query, currentUserId) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = { entityType: query.entityType, entityId: query.entityId };
        const candidates = await this.prisma.document.findMany({
            where,
            include: {
                ...DOCUMENT_INCLUDE,
                versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        });
        const accessible = [];
        for (const doc of candidates) {
            if (await this.canAccess(doc, currentUserId))
                accessible.push(doc);
        }
        const pageItems = accessible.slice(skip, skip + take);
        return {
            items: pageItems.map((doc) => ({
                ...doc,
                latestVersion: doc.versions[0] ?? null,
                versions: undefined,
            })),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, accessible.length),
        };
    }
    async getDocument(id, currentUserId) {
        const document = await this.prisma.document.findUnique({
            where: { id },
            include: {
                ...DOCUMENT_INCLUDE,
                versions: { orderBy: { versionNumber: 'desc' } },
            },
        });
        if (!document)
            throw new app_exception_1.AppException('DOCUMENT_NOT_FOUND', 'Document not found.', common_1.HttpStatus.NOT_FOUND);
        await this.requireAccess(document, currentUserId);
        return document;
    }
    async updateDocument(id, dto) {
        await this.getDocumentOrThrow(id);
        return this.prisma.document.update({ where: { id }, data: dto });
    }
    async setAccess(id, dto) {
        await this.getDocumentOrThrow(id);
        if (dto.scope === client_1.DocumentAccessScope.SPECIFIC_ROLES &&
            !dto.roleIds?.length) {
            throw new app_exception_1.AppException('DOCUMENT_ACCESS_ROLES_REQUIRED', 'Select at least one role to restrict this document to.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.scope === client_1.DocumentAccessScope.SPECIFIC_USERS &&
            !dto.userIds?.length) {
            throw new app_exception_1.AppException('DOCUMENT_ACCESS_USERS_REQUIRED', 'Select at least one user to restrict this document to.', common_1.HttpStatus.BAD_REQUEST);
        }
        const grants = dto.scope === client_1.DocumentAccessScope.SPECIFIC_ROLES
            ? (dto.roleIds ?? []).map((roleId) => ({ roleId }))
            : dto.scope === client_1.DocumentAccessScope.SPECIFIC_USERS
                ? (dto.userIds ?? []).map((userId) => ({ userId }))
                : [];
        await this.prisma.$transaction([
            this.prisma.documentAccessGrant.deleteMany({ where: { documentId: id } }),
            this.prisma.document.update({
                where: { id },
                data: {
                    accessScope: dto.scope,
                    accessGrants: { create: grants },
                },
            }),
        ]);
        return this.prisma.document.findUnique({
            where: { id },
            include: {
                ...DOCUMENT_INCLUDE,
                versions: { orderBy: { versionNumber: 'desc' } },
            },
        });
    }
    async deleteDocument(id) {
        const document = await this.prisma.document.findUnique({
            where: { id },
            include: { versions: true },
        });
        if (!document)
            throw new app_exception_1.AppException('DOCUMENT_NOT_FOUND', 'Document not found.', common_1.HttpStatus.NOT_FOUND);
        await Promise.all(document.versions.map((v) => this.storageService.delete(v.storageKey)));
        await this.prisma.document.delete({ where: { id } });
    }
    async downloadVersion(documentId, versionId, currentUserId) {
        const document = await this.getDocumentOrThrow(documentId);
        await this.requireAccess(document, currentUserId);
        const version = versionId
            ? await this.prisma.documentVersion.findFirst({
                where: { id: versionId, documentId },
            })
            : await this.prisma.documentVersion.findFirst({
                where: { documentId },
                orderBy: { versionNumber: 'desc' },
            });
        if (!version)
            throw new app_exception_1.AppException('DOCUMENT_VERSION_NOT_FOUND', 'Document version not found.', common_1.HttpStatus.NOT_FOUND);
        const stream = this.storageService.createReadStream(version.storageKey);
        return new common_1.StreamableFile(stream, {
            type: version.mimeType,
            disposition: `attachment; filename="${encodeURIComponent(version.originalFileName)}"`,
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        rbac_service_1.RbacService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map