import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/queue/redis.service';
import { AppException } from '../common/filters/app-exception';
import { HttpStatus } from '@nestjs/common';
import {
  PaginatedResult,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../common/pagination/pagination.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionOverrideState, Role } from '@prisma/client';
import {
  ModuleSlug,
  PermissionActionSlug,
} from '../common/constants/modules.constant';

const PERMISSION_CACHE_PREFIX = 'rbac:permissions:';
const PERMISSION_CACHE_TTL_SECONDS = 300;

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ---------------------------------------------------------------------
  // Permissions (fixed catalog — one row per (module, action), seeded once)
  // ---------------------------------------------------------------------

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  // ---------------------------------------------------------------------
  // Roles
  // ---------------------------------------------------------------------

  async listRoles(query: PaginationQueryDto): Promise<PaginatedResult<Role>> {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { permissions: { include: { permission: true } } },
      }),
      this.prisma.role.count(),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role)
      throw new AppException(
        'ROLE_NOT_FOUND',
        'Role not found.',
        HttpStatus.NOT_FOUND,
      );
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.getRole(id);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async deleteRole(id: string) {
    const role = await this.getRole(id);
    if (role.isSystem) {
      throw new AppException(
        'SYSTEM_ROLE_PROTECTED',
        'System roles cannot be deleted.',
        HttpStatus.FORBIDDEN,
      );
    }
    await this.prisma.role.delete({ where: { id } });
    await this.invalidateAllPermissionCaches();
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    await this.getRole(roleId);
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);
    await this.invalidateAllPermissionCaches();
    return this.getRole(roleId);
  }

  // ---------------------------------------------------------------------
  // User <-> Role assignment
  // ---------------------------------------------------------------------

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  async setUserRoles(userId: string, roleIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
        skipDuplicates: true,
      }),
    ]);
    await this.invalidatePermissionCache(userId);
    return this.getUserRoles(userId);
  }

  // ---------------------------------------------------------------------
  // Permission checks (cached — consulted on every guarded request)
  // ---------------------------------------------------------------------

  /// Effective permission = combined (Allow-wins union) role permissions,
  /// then the employee's individual overrides applied on top (Granted always
  /// adds, Denied always removes — an override beats every role, by design).
  /// This is the ONE calculation both PermissionsGuard (backend enforcement)
  /// and the frontend's permission state (via GET /rbac/me) consume, so they
  /// can never disagree with each other. A user with no Employee profile
  /// (e.g. the bootstrap Admin) has no overrides to apply at all — its
  /// access stays purely role-derived, which is what already gives Admin
  /// its full access via the seeded Admin role holding every permission.
  async getUserPermissionKeys(userId: string): Promise<string[]> {
    const cached = await this.redis.get<string[]>(
      PERMISSION_CACHE_PREFIX + userId,
    );
    if (cached) return cached;

    const [userRoles, employee] = await Promise.all([
      this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      }),
      this.prisma.employee.findUnique({
        where: { userId },
        select: { id: true },
      }),
    ]);

    const keys = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        keys.add(
          `${rolePermission.permission.module}:${rolePermission.permission.action}`,
        );
      }
    }

    if (employee) {
      const overrides = await this.prisma.employeePermissionOverride.findMany({
        where: { employeeId: employee.id },
        include: { permission: true },
      });
      for (const override of overrides) {
        const key = `${override.permission.module}:${override.permission.action}`;
        if (override.state === PermissionOverrideState.GRANTED) {
          keys.add(key);
        } else {
          keys.delete(key);
        }
      }
    }

    const result = Array.from(keys);
    await this.redis.set(
      PERMISSION_CACHE_PREFIX + userId,
      result,
      PERMISSION_CACHE_TTL_SECONDS,
    );
    return result;
  }

  async userHasPermission(
    userId: string,
    module: string,
    action: string,
  ): Promise<boolean> {
    const keys = await this.getUserPermissionKeys(userId);
    return keys.includes(`${module}:${action}`);
  }

  /// Whether this account has a linked Employee row — the same
  /// userId-keyed lookup getUserPermissionKeys already does to apply
  /// per-employee overrides, exposed here for GET /rbac/me so the frontend
  /// can distinguish "employee with no permissions yet" from "non-employee
  /// account (e.g. Super Admin) with permissions" without a second
  /// possibly-404ing round trip to /employees/me.
  async hasEmployeeProfile(userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !!employee;
  }

  /// Exported for NotificationsService — "notify everyone who can act on
  /// this" (e.g. a submitted leave/purchase request) needs the set of users
  /// holding a given permission, which Notifications has no direct table
  /// access to compute itself per the cross-module query rule. Not cached
  /// like getUserPermissionKeys since it's only used for the relatively
  /// infrequent "submitted" notification fan-out, not per-request auth.
  /// Overrides are factored in the same Allow-wins-then-override way as
  /// getUserPermissionKeys — otherwise an employee whose access to this
  /// permission was individually Denied would still get notified as if
  /// they could act on it, and one Granted only via override would be
  /// silently skipped.
  async getUserIdsWithPermission(
    module: ModuleSlug,
    action: PermissionActionSlug,
  ): Promise<string[]> {
    const permission = await this.prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });
    if (!permission) return [];

    const [rolePermissions, overrides] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: { permissionId: permission.id },
        select: {
          role: { select: { users: { select: { userId: true } } } },
        },
      }),
      this.prisma.employeePermissionOverride.findMany({
        where: { permissionId: permission.id },
        select: { state: true, employee: { select: { userId: true } } },
      }),
    ]);

    const userIds = new Set<string>();
    for (const rolePermission of rolePermissions) {
      for (const userRole of rolePermission.role.users) {
        userIds.add(userRole.userId);
      }
    }
    for (const override of overrides) {
      if (override.state === PermissionOverrideState.GRANTED) {
        userIds.add(override.employee.userId);
      } else {
        userIds.delete(override.employee.userId);
      }
    }
    return Array.from(userIds);
  }

  // ---------------------------------------------------------------------
  // Individual Employee Permission Overrides
  // ---------------------------------------------------------------------

  private async requireEmployee(
    employeeId: string,
  ): Promise<{ id: string; userId: string }> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, userId: true },
    });
    if (!employee) {
      throw new AppException(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return employee;
  }

  /// The one source of truth for "what does this employee have access to
  /// and why" — used by the employee-detail Access UI (Role Access vs
  /// Employee Override columns) and built from the exact same two
  /// ingredients (role union + overrides) as getUserPermissionKeys, just
  /// projected per-permission instead of collapsed into a flat key array.
  async getEmployeeAccess(employeeId: string) {
    const employee = await this.requireEmployee(employeeId);
    const [allPermissions, userRoles, overrides] = await Promise.all([
      this.prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      }),
      this.prisma.userRole.findMany({
        where: { userId: employee.userId },
        include: { role: { include: { permissions: true } } },
      }),
      this.prisma.employeePermissionOverride.findMany({
        where: { employeeId: employee.id },
      }),
    ]);

    const roleGrantedPermissionIds = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        roleGrantedPermissionIds.add(rolePermission.permissionId);
      }
    }
    const overrideByPermissionId = new Map(
      overrides.map((override) => [override.permissionId, override.state]),
    );

    const permissions = allPermissions.map((permission) => {
      const roleAccess = roleGrantedPermissionIds.has(permission.id)
        ? ('ALLOWED' as const)
        : ('DENIED' as const);
      const override = overrideByPermissionId.get(permission.id) ?? 'INHERITED';
      const effective =
        override === PermissionOverrideState.GRANTED
          ? 'ALLOWED'
          : override === PermissionOverrideState.DENIED
            ? 'DENIED'
            : roleAccess;
      return {
        permissionId: permission.id,
        module: permission.module,
        action: permission.action,
        roleAccess,
        override,
        effective,
      };
    });

    return {
      id: employee.id,
      employeeId: employee.id,
      userId: employee.userId,
      roles: userRoles.map((userRole) => userRole.role),
      permissions,
    };
  }

  /// Security Requirement (Section 13): nobody, including an Admin, can
  /// modify their own roles/overrides through these endpoints — closes an
  /// obvious self-privilege-escalation path. Checked here in the service
  /// layer (not just the controller) so it can never be forgotten by a
  /// future caller.
  private assertNotModifyingSelf(
    targetUserId: string,
    currentUserId: string,
  ): void {
    if (targetUserId === currentUserId) {
      throw new AppException(
        'CANNOT_MODIFY_OWN_ACCESS',
        'You cannot modify your own roles or permission overrides.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async setEmployeeOverride(
    employeeId: string,
    permissionId: string,
    state: PermissionOverrideState,
    currentUserId: string,
  ) {
    const employee = await this.requireEmployee(employeeId);
    this.assertNotModifyingSelf(employee.userId, currentUserId);
    await this.prisma.employeePermissionOverride.upsert({
      where: {
        employeeId_permissionId: { employeeId: employee.id, permissionId },
      },
      create: { employeeId: employee.id, permissionId, state },
      update: { state },
    });
    await this.invalidatePermissionCache(employee.userId);
    return this.getEmployeeAccess(employeeId);
  }

  /// Per-permission reset (Section 8.1 of the spec) — deleting the override
  /// row IS "back to Inherited", since Inherited is never stored explicitly.
  async resetEmployeeOverride(
    employeeId: string,
    permissionId: string,
    currentUserId: string,
  ) {
    const employee = await this.requireEmployee(employeeId);
    this.assertNotModifyingSelf(employee.userId, currentUserId);
    await this.prisma.employeePermissionOverride.deleteMany({
      where: { employeeId: employee.id, permissionId },
    });
    await this.invalidatePermissionCache(employee.userId);
    return this.getEmployeeAccess(employeeId);
  }

  /// "Reset All Overrides" (Section 8.2) — clears every override for this
  /// employee but leaves their assigned roles untouched; access recalculates
  /// from roles alone on the next read.
  async resetAllEmployeeOverrides(employeeId: string, currentUserId: string) {
    const employee = await this.requireEmployee(employeeId);
    this.assertNotModifyingSelf(employee.userId, currentUserId);
    await this.prisma.employeePermissionOverride.deleteMany({
      where: { employeeId: employee.id },
    });
    await this.invalidatePermissionCache(employee.userId);
    return this.getEmployeeAccess(employeeId);
  }

  private async invalidatePermissionCache(userId: string) {
    await this.redis.del(PERMISSION_CACHE_PREFIX + userId);
  }

  /// Any role/permission-assignment mutation can affect every user holding
  /// that role, so the simplest correct invalidation is to drop the whole
  /// cache namespace rather than tracking role -> user fan-out.
  private async invalidateAllPermissionCaches() {
    await this.redis.delByPattern(PERMISSION_CACHE_PREFIX + '*');
  }
}
