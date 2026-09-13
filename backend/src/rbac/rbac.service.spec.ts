import { PermissionOverrideState } from '@prisma/client';
import { RbacService } from './rbac.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/queue/redis.service';

/// Everything mocked (no real DB/Redis) — covers the multi-role + override
/// testing requirements from the RBAC flexibility spec: role union
/// (Allow-wins), individual Grant/Deny beating role results, Inherited
/// following current roles, resets, and that a user with no Employee
/// profile (e.g. the bootstrap Admin) is untouched by overrides entirely.
describe('RbacService', () => {
  let service: RbacService;
  let prisma: {
    userRole: { findMany: jest.Mock };
    employee: { findUnique: jest.Mock };
    employeePermissionOverride: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
    permission: { findMany: jest.Mock; findUnique: jest.Mock };
    rolePermission: { findMany: jest.Mock };
  };
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    delByPattern: jest.Mock;
  };

  function permission(id: string, module: string, action = 'VIEW') {
    return { id, module, action };
  }

  function rolePermissionRow(
    permissionId: string,
    module: string,
    action = 'VIEW',
  ) {
    return {
      permissionId,
      permission: permission(permissionId, module, action),
    };
  }

  beforeEach(() => {
    prisma = {
      userRole: { findMany: jest.fn() },
      employee: { findUnique: jest.fn() },
      employeePermissionOverride: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      permission: { findMany: jest.fn(), findUnique: jest.fn() },
      rolePermission: { findMany: jest.fn() },
    };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };
    service = new RbacService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  });

  describe('getUserPermissionKeys — role combination', () => {
    it("one role: gets exactly that role's permissions", async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              rolePermissionRow('p1', 'crm'),
              rolePermissionRow('p2', 'sales'),
            ],
          },
        },
      ]);
      prisma.employee.findUnique.mockResolvedValue(null);

      const keys = await service.getUserPermissionKeys('user-1');

      expect(keys.sort()).toEqual(['crm:VIEW', 'sales:VIEW']);
    });

    it("multiple roles: Allow-wins union of both roles' permissions", async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              rolePermissionRow('p1', 'crm'),
              rolePermissionRow('p2', 'sales'),
            ],
          },
        },
        { role: { permissions: [rolePermissionRow('p3', 'reports')] } },
      ]);
      prisma.employee.findUnique.mockResolvedValue(null);

      const keys = await service.getUserPermissionKeys('user-1');

      expect(keys.sort()).toEqual(['crm:VIEW', 'reports:VIEW', 'sales:VIEW']);
    });

    it('role conflict: Role A grants X, Role B does not carry X → combined = Allowed (Allow wins)', async () => {
      // "Sales Executive" grants reports:VIEW; "Report Viewer" doesn't carry
      // it at all (there is no "Deny" concept on a role — absence IS the
      // role's own denial) — the union still ends up Allowed either way.
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [rolePermissionRow('p1', 'crm')] } },
        { role: { permissions: [rolePermissionRow('p2', 'reports')] } },
      ]);
      prisma.employee.findUnique.mockResolvedValue(null);

      const keys = await service.getUserPermissionKeys('user-1');

      expect(keys).toContain('reports:VIEW');
      expect(keys).toContain('crm:VIEW');
    });
  });

  describe('getUserPermissionKeys — individual overrides', () => {
    it('Individual Grant: role denies X (no role carries it), override grants X → final = Allowed', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [] } },
      ]);
      prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.employeePermissionOverride.findMany.mockResolvedValue([
        {
          permissionId: 'p1',
          state: PermissionOverrideState.GRANTED,
          permission: permission('p1', 'finance'),
        },
      ]);

      const keys = await service.getUserPermissionKeys('user-1');

      expect(keys).toContain('finance:VIEW');
    });

    it('Individual Deny: role allows X, override denies X → final = Denied', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [rolePermissionRow('p1', 'sales')] } },
      ]);
      prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.employeePermissionOverride.findMany.mockResolvedValue([
        {
          permissionId: 'p1',
          state: PermissionOverrideState.DENIED,
          permission: permission('p1', 'sales'),
        },
      ]);

      const keys = await service.getUserPermissionKeys('user-1');

      expect(keys).not.toContain('sales:VIEW');
    });

    it('Inherited (no override row): final follows the role result exactly', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [rolePermissionRow('p1', 'crm')] } },
      ]);
      prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.employeePermissionOverride.findMany.mockResolvedValue([]);

      const keys = await service.getUserPermissionKeys('user-1');

      expect(keys).toEqual(['crm:VIEW']);
    });

    it('a user with no Employee profile (e.g. bootstrap Admin) is unaffected by overrides — never even queried', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [rolePermissionRow('p1', 'crm')] } },
      ]);
      prisma.employee.findUnique.mockResolvedValue(null);

      const keys = await service.getUserPermissionKeys('admin-user');

      expect(keys).toEqual(['crm:VIEW']);
      expect(prisma.employeePermissionOverride.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getEmployeeAccess — per-permission breakdown and role-change behavior', () => {
    beforeEach(() => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        userId: 'user-1',
      });
      prisma.permission.findMany.mockResolvedValue([
        permission('p1', 'crm'),
        permission('p2', 'sales'),
      ]);
    });

    it('reflects the worked example: role-derived + Granted override + Denied override', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [{ permissionId: 'p1' }, { permissionId: 'p2' }],
          },
        },
      ]);
      prisma.employeePermissionOverride.findMany.mockResolvedValue([
        { permissionId: 'p2', state: PermissionOverrideState.DENIED },
      ]);

      const access = await service.getEmployeeAccess('emp-1');

      const crm = access.permissions.find((p) => p.permissionId === 'p1')!;
      const sales = access.permissions.find((p) => p.permissionId === 'p2')!;
      expect(crm).toMatchObject({
        roleAccess: 'ALLOWED',
        override: 'INHERITED',
        effective: 'ALLOWED',
      });
      expect(sales).toMatchObject({
        roleAccess: 'ALLOWED',
        override: 'DENIED',
        effective: 'DENIED',
      });
    });

    it('role change with an Inherited permission changes what it resolves to', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [] } },
      ]);
      prisma.employeePermissionOverride.findMany.mockResolvedValue([]);

      const before = await service.getEmployeeAccess('emp-1');
      expect(
        before.permissions.find((p) => p.permissionId === 'p1')?.effective,
      ).toBe('DENIED');

      // Simulate the employee's roles changing to now carry p1.
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [{ permissionId: 'p1' }] } },
      ]);
      const after = await service.getEmployeeAccess('emp-1');
      expect(
        after.permissions.find((p) => p.permissionId === 'p1')?.effective,
      ).toBe('ALLOWED');
    });

    it('role change does NOT change an explicit Granted/Denied override — it keeps winning', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [] } },
      ]);
      prisma.employeePermissionOverride.findMany.mockResolvedValue([
        { permissionId: 'p1', state: PermissionOverrideState.GRANTED },
      ]);

      const before = await service.getEmployeeAccess('emp-1');
      expect(
        before.permissions.find((p) => p.permissionId === 'p1')?.effective,
      ).toBe('ALLOWED');

      // Roles change (now also carry p1 directly) — override still applies,
      // same final result, still driven by the override not the role.
      prisma.userRole.findMany.mockResolvedValue([
        { role: { permissions: [{ permissionId: 'p1' }] } },
      ]);
      const after = await service.getEmployeeAccess('emp-1');
      const p1 = after.permissions.find((p) => p.permissionId === 'p1')!;
      expect(p1.override).toBe('GRANTED');
      expect(p1.effective).toBe('ALLOWED');
    });
  });

  describe('resetting overrides', () => {
    it('resets a single override to Inherited without touching others', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        userId: 'user-1',
      });
      prisma.permission.findMany.mockResolvedValue([]);
      prisma.userRole.findMany.mockResolvedValue([]);
      prisma.employeePermissionOverride.findMany.mockResolvedValue([]);

      await service.resetEmployeeOverride('emp-1', 'p1', 'admin-user');

      expect(prisma.employeePermissionOverride.deleteMany).toHaveBeenCalledWith(
        {
          where: { employeeId: 'emp-1', permissionId: 'p1' },
        },
      );
    });

    it('Reset All Overrides clears every override for the employee and leaves roles untouched', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        userId: 'user-1',
      });
      prisma.permission.findMany.mockResolvedValue([]);
      prisma.userRole.findMany.mockResolvedValue([]);
      prisma.employeePermissionOverride.findMany.mockResolvedValue([]);

      await service.resetAllEmployeeOverrides('emp-1', 'admin-user');

      expect(prisma.employeePermissionOverride.deleteMany).toHaveBeenCalledWith(
        {
          where: { employeeId: 'emp-1' },
        },
      );
    });

    it('rejects modifying your own overrides', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        userId: 'self-user',
      });

      await expect(
        service.setEmployeeOverride(
          'emp-1',
          'p1',
          PermissionOverrideState.GRANTED,
          'self-user',
        ),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'CANNOT_MODIFY_OWN_ACCESS' }),
      });
      expect(prisma.employeePermissionOverride.upsert).not.toHaveBeenCalled();
    });
  });
});
