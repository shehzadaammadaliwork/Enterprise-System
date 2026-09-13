import { HttpStatus, Injectable, StreamableFile } from '@nestjs/common';
import {
  Document,
  DocumentAccessGrant,
  DocumentAccessScope,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
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

/// Spec: "file type/size limits enforced". A generic-but-not-unlimited
/// allowlist covering common office/document/image/archive types — this
/// module attaches to arbitrary records, so it can't know in advance what a
/// caller will want to upload, unlike e.g. a dedicated avatar-upload field.
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
export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

const DOCUMENT_INCLUDE = { accessGrants: true } as const;

type DocumentWithGrants = Document & { accessGrants: DocumentAccessGrant[] };

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly rbacService: RbacService,
  ) {}

  /// SPECIFIC_ROLES/SPECIFIC_USERS restrict content visibility below the
  /// general documents:VIEW permission gate — this is the first per-record
  /// ACL in the system, layered on top of (not instead of) RBAC. No admin
  /// bypass: a document restricted away from a role stays restricted even
  /// from an Admin not in that role/user list, matching what "restricted"
  /// means for something like a payroll document. Used only by the
  /// content-reading paths (getDocument, downloadVersion, listForEntity's
  /// filtering) — NOT by management actions (update/setAccess/delete/
  /// addVersion), which are gated by RBAC permission alone. Applying it to
  /// management too would let a document's own grants permanently lock
  /// everyone, including an Admin holding documents:EDIT, out of ever
  /// fixing its access again.
  private async canAccess(
    document: DocumentWithGrants,
    userId: string,
  ): Promise<boolean> {
    if (document.accessScope === DocumentAccessScope.EVERYONE) return true;
    if (document.accessScope === DocumentAccessScope.SPECIFIC_USERS) {
      return document.accessGrants.some((g) => g.userId === userId);
    }
    // SPECIFIC_ROLES
    const grantedRoleIds = new Set(
      document.accessGrants.map((g) => g.roleId).filter(Boolean),
    );
    const userRoles = await this.rbacService.getUserRoles(userId);
    return userRoles.some((ur) => grantedRoleIds.has(ur.roleId));
  }

  private async getDocumentOrThrow(id: string): Promise<DocumentWithGrants> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: DOCUMENT_INCLUDE,
    });
    if (!document)
      throw new AppException(
        'DOCUMENT_NOT_FOUND',
        'Document not found.',
        HttpStatus.NOT_FOUND,
      );
    return document;
  }

  private async requireAccess(
    document: DocumentWithGrants,
    userId: string,
  ): Promise<void> {
    if (!(await this.canAccess(document, userId))) {
      throw new AppException(
        'DOCUMENT_ACCESS_DENIED',
        'You do not have access to this document.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async uploadDocument(
    dto: UploadDocumentDto,
    file: UploadedFileInput,
    uploadedByUserId: string,
  ) {
    const stored = await this.storageService.save({
      folder: `documents/${dto.entityType}/${dto.entityId}`,
      fileName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
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

  async addVersion(
    documentId: string,
    file: UploadedFileInput,
    uploadedByUserId: string,
  ) {
    // No access-scope check here (or in updateDocument/setAccess/
    // deleteDocument below) — deliberately. Management actions are gated
    // by documents:EDIT/DELETE alone, same as everywhere else in this
    // system's RBAC model. Requiring the content-visibility check too
    // would let a document's own access grants lock everyone — including
    // an Admin with documents:EDIT — out of ever managing it again, with
    // no recovery path. Only reading content (getDocument, download,
    // listForEntity) enforces accessScope; see canAccess's doc comment.
    const document = await this.getDocumentOrThrow(documentId);

    const stored = await this.storageService.save({
      folder: `documents/${document.entityType}/${document.entityId}`,
      fileName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
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

  async listForEntity(query: ListDocumentsQueryDto, currentUserId: string) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = { entityType: query.entityType, entityId: query.entityId };
    const candidates = await this.prisma.document.findMany({
      where,
      include: {
        ...DOCUMENT_INCLUDE,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Access filtering happens after the DB query (per-row RBAC/role checks
    // aren't expressible as a Prisma where clause) — paginate the filtered
    // set in memory. Document counts per entity are small in practice, so
    // this doesn't need push-down filtering the way list-heavy modules do.
    const accessible: typeof candidates = [];
    for (const doc of candidates) {
      if (await this.canAccess(doc, currentUserId)) accessible.push(doc);
    }
    const pageItems = accessible.slice(skip, skip + take);
    return {
      items: pageItems.map((doc) => ({
        ...doc,
        latestVersion: doc.versions[0] ?? null,
        versions: undefined,
      })),
      meta: buildPaginationMeta(page, limit, accessible.length),
    };
  }

  async getDocument(id: string, currentUserId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        ...DOCUMENT_INCLUDE,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!document)
      throw new AppException(
        'DOCUMENT_NOT_FOUND',
        'Document not found.',
        HttpStatus.NOT_FOUND,
      );
    await this.requireAccess(document, currentUserId);
    return document;
  }

  async updateDocument(id: string, dto: UpdateDocumentDto) {
    await this.getDocumentOrThrow(id);
    return this.prisma.document.update({ where: { id }, data: dto });
  }

  /// scope EVERYONE clears any existing grants; SPECIFIC_ROLES/
  /// SPECIFIC_USERS replaces the grant set wholesale (delete + recreate in
  /// one transaction), same replace-wholesale pattern as
  /// RbacService.setUserRoles.
  async setAccess(id: string, dto: SetDocumentAccessDto) {
    await this.getDocumentOrThrow(id);

    if (
      dto.scope === DocumentAccessScope.SPECIFIC_ROLES &&
      !dto.roleIds?.length
    ) {
      throw new AppException(
        'DOCUMENT_ACCESS_ROLES_REQUIRED',
        'Select at least one role to restrict this document to.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      dto.scope === DocumentAccessScope.SPECIFIC_USERS &&
      !dto.userIds?.length
    ) {
      throw new AppException(
        'DOCUMENT_ACCESS_USERS_REQUIRED',
        'Select at least one user to restrict this document to.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const grants =
      dto.scope === DocumentAccessScope.SPECIFIC_ROLES
        ? (dto.roleIds ?? []).map((roleId) => ({ roleId }))
        : dto.scope === DocumentAccessScope.SPECIFIC_USERS
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
    // Returns the updated document directly (not via the access-gated
    // getDocument) — the person who just restricted a document isn't
    // necessarily in its own grant list (e.g. an Admin restricting a
    // document to a role they don't hold themselves), and that must not
    // turn a successful update into a confusing 403 on its own response.
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        ...DOCUMENT_INCLUDE,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!document)
      throw new AppException(
        'DOCUMENT_NOT_FOUND',
        'Document not found.',
        HttpStatus.NOT_FOUND,
      );

    await Promise.all(
      document.versions.map((v) => this.storageService.delete(v.storageKey)),
    );
    await this.prisma.document.delete({ where: { id } });
  }

  /// Returns the requested version (or the latest, if versionId is
  /// omitted) as a fully-configured StreamableFile — Content-Type and the
  /// download filename are set here via StreamableFile's own options
  /// rather than in the controller, since @Header() only accepts static
  /// values and these vary per document.
  async downloadVersion(
    documentId: string,
    versionId: string | undefined,
    currentUserId: string,
  ): Promise<StreamableFile> {
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
      throw new AppException(
        'DOCUMENT_VERSION_NOT_FOUND',
        'Document version not found.',
        HttpStatus.NOT_FOUND,
      );

    const stream = this.storageService.createReadStream(version.storageKey);
    return new StreamableFile(stream, {
      type: version.mimeType,
      disposition: `attachment; filename="${encodeURIComponent(version.originalFileName)}"`,
    });
  }
}
