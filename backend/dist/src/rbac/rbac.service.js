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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const redis_service_1 = require("../common/queue/redis.service");
const app_exception_1 = require("../common/filters/app-exception");
const common_2 = require("@nestjs/common");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
const client_1 = require("@prisma/client");
const PERMISSION_CACHE_PREFIX = 'rbac:permissions:';
const PERMISSION_CACHE_TTL_SECONDS = 300;
let RbacService = class RbacService {
    prisma;
    redis;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    listPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }],
        });
    }
    async listRoles(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.role.findMany({
                skip,
                take,
                orderBy: { name: 'asc' },
                include: { permissions: { include: { permission: true } } },
            }),
            this.prisma.role.count(),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async getRole(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: { permissions: { include: { permission: true } } },
        });
        if (!role)
            throw new app_exception_1.AppException('ROLE_NOT_FOUND', 'Role not found.', common_2.HttpStatus.NOT_FOUND);
        return role;
    }
    async createRole(dto) {
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
    async updateRole(id, dto) {
        await this.getRole(id);
        return this.prisma.role.update({ where: { id }, data: dto });
    }
    async deleteRole(id) {
        const role = await this.getRole(id);
        if (role.isSystem) {
            throw new app_exception_1.AppException('SYSTEM_ROLE_PROTECTED', 'System roles cannot be deleted.', common_2.HttpStatus.FORBIDDEN);
        }
        await this.prisma.role.delete({ where: { id } });
        await this.invalidateAllPermissionCaches();
    }
    async setRolePermissions(roleId, permissionIds) {
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
    async getUserRoles(userId) {
        return this.prisma.userRole.findMany({
            where: { userId },
            include: { role: true },
        });
    }
    async setUserRoles(userId, roleIds) {
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
    async getUserPermissionKeys(userId) {
        const cached = await this.redis.get(PERMISSION_CACHE_PREFIX + userId);
        if (cached)
            return cached;
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
        const keys = new Set();
        for (const userRole of userRoles) {
            for (const rolePermission of userRole.role.permissions) {
                keys.add(`${rolePermission.permission.module}:${rolePermission.permission.action}`);
            }
        }
        if (employee) {
            const overrides = await this.prisma.employeePermissionOverride.findMany({
                where: { employeeId: employee.id },
                include: { permission: true },
            });
            for (const override of overrides) {
                const key = `${override.permission.module}:${override.permission.action}`;
                if (override.state === client_1.PermissionOverrideState.GRANTED) {
                    keys.add(key);
                }
                else {
                    keys.delete(key);
                }
            }
        }
        const result = Array.from(keys);
        await this.redis.set(PERMISSION_CACHE_PREFIX + userId, result, PERMISSION_CACHE_TTL_SECONDS);
        return result;
    }
    async userHasPermission(userId, module, action) {
        const keys = await this.getUserPermissionKeys(userId);
        return keys.includes(`${module}:${action}`);
    }
    async hasEmployeeProfile(userId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
            select: { id: true },
        });
        return !!employee;
    }
    async getUserIdsWithPermission(module, action) {
        const permission = await this.prisma.permission.findUnique({
            where: { module_action: { module, action } },
        });
        if (!permission)
            return [];
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
        const userIds = new Set();
        for (const rolePermission of rolePermissions) {
            for (const userRole of rolePermission.role.users) {
                userIds.add(userRole.userId);
            }
        }
        for (const override of overrides) {
            if (override.state === client_1.PermissionOverrideState.GRANTED) {
                userIds.add(override.employee.userId);
            }
            else {
                userIds.delete(override.employee.userId);
            }
        }
        return Array.from(userIds);
    }
    async requireEmployee(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, userId: true },
        });
        if (!employee) {
            throw new app_exception_1.AppException('EMPLOYEE_NOT_FOUND', 'Employee not found.', common_2.HttpStatus.NOT_FOUND);
        }
        return employee;
    }
    async getEmployeeAccess(employeeId) {
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
        const roleGrantedPermissionIds = new Set();
        for (const userRole of userRoles) {
            for (const rolePermission of userRole.role.permissions) {
                roleGrantedPermissionIds.add(rolePermission.permissionId);
            }
        }
        const overrideByPermissionId = new Map(overrides.map((override) => [override.permissionId, override.state]));
        const permissions = allPermissions.map((permission) => {
            const roleAccess = roleGrantedPermissionIds.has(permission.id)
                ? 'ALLOWED'
                : 'DENIED';
            const override = overrideByPermissionId.get(permission.id) ?? 'INHERITED';
            const effective = override === client_1.PermissionOverrideState.GRANTED
                ? 'ALLOWED'
                : override === client_1.PermissionOverrideState.DENIED
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
    assertNotModifyingSelf(targetUserId, currentUserId) {
        if (targetUserId === currentUserId) {
            throw new app_exception_1.AppException('CANNOT_MODIFY_OWN_ACCESS', 'You cannot modify your own roles or permission overrides.', common_2.HttpStatus.FORBIDDEN);
        }
    }
    async setEmployeeOverride(employeeId, permissionId, state, currentUserId) {
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
    async resetEmployeeOverride(employeeId, permissionId, currentUserId) {
        const employee = await this.requireEmployee(employeeId);
        this.assertNotModifyingSelf(employee.userId, currentUserId);
        await this.prisma.employeePermissionOverride.deleteMany({
            where: { employeeId: employee.id, permissionId },
        });
        await this.invalidatePermissionCache(employee.userId);
        return this.getEmployeeAccess(employeeId);
    }
    async resetAllEmployeeOverrides(employeeId, currentUserId) {
        const employee = await this.requireEmployee(employeeId);
        this.assertNotModifyingSelf(employee.userId, currentUserId);
        await this.prisma.employeePermissionOverride.deleteMany({
            where: { employeeId: employee.id },
        });
        await this.invalidatePermissionCache(employee.userId);
        return this.getEmployeeAccess(employeeId);
    }
    async invalidatePermissionCache(userId) {
        await this.redis.del(PERMISSION_CACHE_PREFIX + userId);
    }
    async invalidateAllPermissionCaches() {
        await this.redis.delByPattern(PERMISSION_CACHE_PREFIX + '*');
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map