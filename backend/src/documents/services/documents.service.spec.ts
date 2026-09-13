import { DocumentAccessScope } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { RbacService } from '../../rbac/rbac.service';

/// Unit tests for the rule that matters most here: the per-record access
/// scope (EVERYONE/SPECIFIC_ROLES/SPECIFIC_USERS) that sits below the
/// general documents:VIEW RBAC gate. Prisma/Storage/Rbac are all mocked,
/// same style as the other modules' service spec tests.
describe('DocumentsService — access scope', () => {
  let service: DocumentsService;
  let prisma: {
    document: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
    documentAccessGrant: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let rbacService: { getUserRoles: jest.Mock };

  beforeEach(() => {
    prisma = {
      document: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      documentAccessGrant: { deleteMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    rbacService = { getUserRoles: jest.fn().mockResolvedValue([]) };
    service = new DocumentsService(
      prisma as unknown as PrismaService,
      {} as unknown as StorageService,
      rbacService as unknown as RbacService,
    );
  });

  describe('getDocument', () => {
    it('allows any user when scope is EVERYONE', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd1',
        accessScope: DocumentAccessScope.EVERYONE,
        accessGrants: [],
        versions: [],
      });

      await expect(service.getDocument('d1', 'user-1')).resolves.toBeDefined();
    });

    it('denies a user not in the SPECIFIC_USERS grant list', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd2',
        accessScope: DocumentAccessScope.SPECIFIC_USERS,
        accessGrants: [{ userId: 'user-allowed' }],
        versions: [],
      });

      await expect(
        service.getDocument('d2', 'user-other'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'DOCUMENT_ACCESS_DENIED' }),
      });
    });

    it('allows a user in the SPECIFIC_USERS grant list', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd3',
        accessScope: DocumentAccessScope.SPECIFIC_USERS,
        accessGrants: [{ userId: 'user-allowed' }],
        versions: [],
      });

      await expect(
        service.getDocument('d3', 'user-allowed'),
      ).resolves.toBeDefined();
    });

    it('allows a user whose role is in the SPECIFIC_ROLES grant list', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd4',
        accessScope: DocumentAccessScope.SPECIFIC_ROLES,
        accessGrants: [{ roleId: 'role-finance' }],
        versions: [],
      });
      rbacService.getUserRoles.mockResolvedValue([{ roleId: 'role-finance' }]);

      await expect(service.getDocument('d4', 'user-1')).resolves.toBeDefined();
    });

    it('denies a user whose roles do not intersect the SPECIFIC_ROLES grant list', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd5',
        accessScope: DocumentAccessScope.SPECIFIC_ROLES,
        accessGrants: [{ roleId: 'role-finance' }],
        versions: [],
      });
      rbacService.getUserRoles.mockResolvedValue([{ roleId: 'role-sales' }]);

      await expect(service.getDocument('d5', 'user-1')).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'DOCUMENT_ACCESS_DENIED' }),
      });
    });
  });

  describe('setAccess validation', () => {
    it('rejects SPECIFIC_ROLES with no roleIds', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd6',
        accessScope: DocumentAccessScope.EVERYONE,
        accessGrants: [],
      });

      await expect(
        service.setAccess('d6', { scope: DocumentAccessScope.SPECIFIC_ROLES }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'DOCUMENT_ACCESS_ROLES_REQUIRED',
        }),
      });
    });

    it('rejects SPECIFIC_USERS with no userIds', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'd7',
        accessScope: DocumentAccessScope.EVERYONE,
        accessGrants: [],
      });

      await expect(
        service.setAccess('d7', { scope: DocumentAccessScope.SPECIFIC_USERS }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'DOCUMENT_ACCESS_USERS_REQUIRED',
        }),
      });
    });

    it('lets an Admin restrict a document to a role they do not hold themselves, without locking them out', async () => {
      // Regression test: setAccess must not require passing the
      // content-visibility check, or a document's own new grants could
      // lock out the very person who just set them (and everyone else
      // without documents:EDIT + that grant), with no recovery path.
      prisma.document.findUnique.mockResolvedValueOnce({
        id: 'd8',
        accessScope: DocumentAccessScope.EVERYONE,
        accessGrants: [],
      });
      prisma.document.findUnique.mockResolvedValueOnce({
        id: 'd8',
        accessScope: DocumentAccessScope.SPECIFIC_ROLES,
        accessGrants: [{ roleId: 'role-not-held-by-admin' }],
        versions: [],
      });

      const result = await service.setAccess('d8', {
        scope: DocumentAccessScope.SPECIFIC_ROLES,
        roleIds: ['role-not-held-by-admin'],
      });

      expect(result).toBeDefined();
    });
  });

  describe('listForEntity', () => {
    it('filters out documents the current user cannot access', async () => {
      prisma.document.findMany.mockResolvedValue([
        {
          id: 'visible',
          accessScope: DocumentAccessScope.EVERYONE,
          accessGrants: [],
          versions: [],
        },
        {
          id: 'hidden',
          accessScope: DocumentAccessScope.SPECIFIC_USERS,
          accessGrants: [{ userId: 'someone-else' }],
          versions: [],
        },
      ]);

      const result = await service.listForEntity(
        { entityType: 'Employee', entityId: 'emp-1', page: 1, limit: 20 },
        'user-1',
      );

      expect(result.items.map((d) => d.id)).toEqual(['visible']);
      expect(result.meta.total).toBe(1);
    });
  });
});
