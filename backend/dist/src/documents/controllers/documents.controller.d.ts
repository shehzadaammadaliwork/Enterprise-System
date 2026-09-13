import { DocumentsService } from '../services/documents.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { SetDocumentAccessDto } from '../dto/set-document-access.dto';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    listForEntity(query: ListDocumentsQueryDto, user: AuthenticatedUser): Promise<{
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
    uploadDocument(dto: UploadDocumentDto, file: Express.Multer.File | undefined, user: AuthenticatedUser): Promise<{
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
    getDocument(id: string, user: AuthenticatedUser): Promise<{
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
    addVersion(id: string, file: Express.Multer.File | undefined, user: AuthenticatedUser): Promise<{
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
    downloadLatest(id: string, user: AuthenticatedUser): Promise<import("@nestjs/common").StreamableFile>;
    downloadVersion(id: string, versionId: string, user: AuthenticatedUser): Promise<import("@nestjs/common").StreamableFile>;
}
