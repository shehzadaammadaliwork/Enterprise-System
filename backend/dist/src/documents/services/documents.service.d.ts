import { StreamableFile } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { RbacService } from '../../rbac/rbac.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { SetDocumentAccessDto } from '../dto/set-document-access.dto';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';
export interface UploadedFileInput {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}
export declare const MAX_DOCUMENT_SIZE_BYTES: number;
export declare class DocumentsService {
    private readonly prisma;
    private readonly storageService;
    private readonly rbacService;
    constructor(prisma: PrismaService, storageService: StorageService, rbacService: RbacService);
    private canAccess;
    private getDocumentOrThrow;
    private requireAccess;
    uploadDocument(dto: UploadDocumentDto, file: UploadedFileInput, uploadedByUserId: string): Promise<{
        versions: {
            id: string;
            createdAt: Date;
            mimeType: string;
            sizeBytes: number;
            checksum: string;
            uploadedByUserId: string;
            documentId: string;
            versionNumber: number;
            storageKey: string;
            originalFileName: string;
        }[];
        accessGrants: {
            id: string;
            createdAt: Date;
            roleId: string | null;
            userId: string | null;
            documentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        entityType: string;
        entityId: string;
        title: string;
        accessScope: import("@prisma/client").$Enums.DocumentAccessScope;
        uploadedByUserId: string;
    }>;
    addVersion(documentId: string, file: UploadedFileInput, uploadedByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        mimeType: string;
        sizeBytes: number;
        checksum: string;
        uploadedByUserId: string;
        documentId: string;
        versionNumber: number;
        storageKey: string;
        originalFileName: string;
    }>;
    listForEntity(query: ListDocumentsQueryDto, currentUserId: string): Promise<{
        items: {
            latestVersion: {
                id: string;
                createdAt: Date;
                mimeType: string;
                sizeBytes: number;
                checksum: string;
                uploadedByUserId: string;
                documentId: string;
                versionNumber: number;
                storageKey: string;
                originalFileName: string;
            };
            versions: undefined;
            accessGrants: {
                id: string;
                createdAt: Date;
                roleId: string | null;
                userId: string | null;
                documentId: string;
            }[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            entityType: string;
            entityId: string;
            title: string;
            accessScope: import("@prisma/client").$Enums.DocumentAccessScope;
            uploadedByUserId: string;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getDocument(id: string, currentUserId: string): Promise<{
        versions: {
            id: string;
            createdAt: Date;
            mimeType: string;
            sizeBytes: number;
            checksum: string;
            uploadedByUserId: string;
            documentId: string;
            versionNumber: number;
            storageKey: string;
            originalFileName: string;
        }[];
        accessGrants: {
            id: string;
            createdAt: Date;
            roleId: string | null;
            userId: string | null;
            documentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        entityType: string;
        entityId: string;
        title: string;
        accessScope: import("@prisma/client").$Enums.DocumentAccessScope;
        uploadedByUserId: string;
    }>;
    updateDocument(id: string, dto: UpdateDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        entityType: string;
        entityId: string;
        title: string;
        accessScope: import("@prisma/client").$Enums.DocumentAccessScope;
        uploadedByUserId: string;
    }>;
    setAccess(id: string, dto: SetDocumentAccessDto): Promise<({
        versions: {
            id: string;
            createdAt: Date;
            mimeType: string;
            sizeBytes: number;
            checksum: string;
            uploadedByUserId: string;
            documentId: string;
            versionNumber: number;
            storageKey: string;
            originalFileName: string;
        }[];
        accessGrants: {
            id: string;
            createdAt: Date;
            roleId: string | null;
            userId: string | null;
            documentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        entityType: string;
        entityId: string;
        title: string;
        accessScope: import("@prisma/client").$Enums.DocumentAccessScope;
        uploadedByUserId: string;
    }) | null>;
    deleteDocument(id: string): Promise<void>;
    downloadVersion(documentId: string, versionId: string | undefined, currentUserId: string): Promise<StreamableFile>;
}
