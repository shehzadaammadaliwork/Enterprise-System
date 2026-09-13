import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/queue/redis.service';
import { PaginatedResult, PaginationQueryDto } from '../common/pagination/pagination.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionOverrideState, Role } from '@prisma/client';
import { ModuleSlug, PermissionActionSlug } from '../common/constants/modules.constant';
export declare class RbacService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    listPermissions(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        module: string;
        action: import("@prisma/client").$Enums.PermissionAction;
        description: string | null;
    }[]>;
    listRoles(query: PaginationQueryDto): Promise<PaginatedResult<Role>>;
    getRole(id: string): Promise<{
        permissions: ({
            permission: {
                id: string;
                module: string;
                action: import("@prisma/client").$Enums.PermissionAction;
                description: string | null;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        description: string | null;
        name: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createRole(dto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                module: string;
                action: import("@prisma/client").$Enums.PermissionAction;
                description: string | null;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        description: string | null;
        name: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<{
        id: string;
        description: string | null;
        name: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteRole(id: string): Promise<void>;
    setRolePermissions(roleId: string, permissionIds: string[]): Promise<{
        permissions: ({
            permission: {
                id: string;
                module: string;
                action: import("@prisma/client").$Enums.PermissionAction;
                description: string | null;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        description: string | null;
        name: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserRoles(userId: string): Promise<({
        role: {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        roleId: string;
        userId: string;
    })[]>;
    setUserRoles(userId: string, roleIds: string[]): Promise<({
        role: {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        roleId: string;
        userId: string;
    })[]>;
    getUserPermissionKeys(userId: string): Promise<string[]>;
    userHasPermission(userId: string, module: string, action: string): Promise<boolean>;
    hasEmployeeProfile(userId: string): Promise<boolean>;
    getUserIdsWithPermission(module: ModuleSlug, action: PermissionActionSlug): Promise<string[]>;
    private requireEmployee;
    getEmployeeAccess(employeeId: string): Promise<{
        id: string;
        employeeId: string;
        userId: string;
        roles: ({
            permissions: {
                id: string;
                roleId: string;
                permissionId: string;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        permissions: {
            permissionId: string;
            module: string;
            action: import("@prisma/client").$Enums.PermissionAction;
            roleAccess: "DENIED" | "ALLOWED";
            override: string;
            effective: "DENIED" | "ALLOWED";
        }[];
    }>;
    private assertNotModifyingSelf;
    setEmployeeOverride(employeeId: string, permissionId: string, state: PermissionOverrideState, currentUserId: string): Promise<{
        id: string;
        employeeId: string;
        userId: string;
        roles: ({
            permissions: {
                id: string;
                roleId: string;
                permissionId: string;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        permissions: {
            permissionId: string;
            module: string;
            action: import("@prisma/client").$Enums.PermissionAction;
            roleAccess: "DENIED" | "ALLOWED";
            override: string;
            effective: "DENIED" | "ALLOWED";
        }[];
    }>;
    resetEmployeeOverride(employeeId: string, permissionId: string, currentUserId: string): Promise<{
        id: string;
        employeeId: string;
        userId: string;
        roles: ({
            permissions: {
                id: string;
                roleId: string;
                permissionId: string;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        permissions: {
            permissionId: string;
            module: string;
            action: import("@prisma/client").$Enums.PermissionAction;
            roleAccess: "DENIED" | "ALLOWED";
            override: string;
            effective: "DENIED" | "ALLOWED";
        }[];
    }>;
    resetAllEmployeeOverrides(employeeId: string, currentUserId: string): Promise<{
        id: string;
        employeeId: string;
        userId: string;
        roles: ({
            permissions: {
                id: string;
                roleId: string;
                permissionId: string;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        permissions: {
            permissionId: string;
            module: string;
            action: import("@prisma/client").$Enums.PermissionAction;
            roleAccess: "DENIED" | "ALLOWED";
            override: string;
            effective: "DENIED" | "ALLOWED";
        }[];
    }>;
    private invalidatePermissionCache;
    private invalidateAllPermissionCaches;
}
