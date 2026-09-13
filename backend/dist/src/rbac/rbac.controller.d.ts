import { RbacService } from './rbac.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { SetEmployeeOverrideDto } from './dto/set-employee-override.dto';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
    getMyAccess(user: AuthenticatedUser): Promise<{
        roles: {
            id: string;
            description: string | null;
            name: string;
            isSystem: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        permissions: string[];
        hasEmployeeProfile: boolean;
    }>;
    listPermissions(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        module: string;
        action: import("@prisma/client").$Enums.PermissionAction;
        description: string | null;
    }[]>;
    listRoles(query: PaginationQueryDto): Promise<import("../common/pagination/pagination.dto").PaginatedResult<{
        id: string;
        description: string | null;
        name: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>>;
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
    setRolePermissions(id: string, dto: AssignPermissionsDto): Promise<{
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
    setUserRoles(userId: string, dto: AssignRolesDto, user: AuthenticatedUser): Promise<({
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
    setEmployeeOverride(employeeId: string, permissionId: string, dto: SetEmployeeOverrideDto, user: AuthenticatedUser): Promise<{
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
    resetEmployeeOverride(employeeId: string, permissionId: string, user: AuthenticatedUser): Promise<{
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
    resetAllEmployeeOverrides(employeeId: string, user: AuthenticatedUser): Promise<{
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
}
