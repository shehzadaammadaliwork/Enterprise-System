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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const require_permission_decorator_1 = require("./decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const assign_permissions_dto_1 = require("./dto/assign-permissions.dto");
const assign_roles_dto_1 = require("./dto/assign-roles.dto");
const set_employee_override_dto_1 = require("./dto/set-employee-override.dto");
let RbacController = class RbacController {
    rbacService;
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    async getMyAccess(user) {
        const [roles, permissions, hasEmployeeProfile] = await Promise.all([
            this.rbacService.getUserRoles(user.id),
            this.rbacService.getUserPermissionKeys(user.id),
            this.rbacService.hasEmployeeProfile(user.id),
        ]);
        return {
            roles: roles.map((userRole) => userRole.role),
            permissions,
            hasEmployeeProfile,
        };
    }
    listPermissions() {
        return this.rbacService.listPermissions();
    }
    listRoles(query) {
        return this.rbacService.listRoles(query);
    }
    getRole(id) {
        return this.rbacService.getRole(id);
    }
    createRole(dto) {
        return this.rbacService.createRole(dto);
    }
    updateRole(id, dto) {
        return this.rbacService.updateRole(id, dto);
    }
    deleteRole(id) {
        return this.rbacService.deleteRole(id);
    }
    setRolePermissions(id, dto) {
        return this.rbacService.setRolePermissions(id, dto.permissionIds);
    }
    getUserRoles(userId) {
        return this.rbacService.getUserRoles(userId);
    }
    setUserRoles(userId, dto, user) {
        if (userId === user.id) {
            throw new common_1.ForbiddenException({
                code: 'CANNOT_MODIFY_OWN_ACCESS',
                message: 'You cannot modify your own roles or permission overrides.',
            });
        }
        return this.rbacService.setUserRoles(userId, dto.roleIds);
    }
    getEmployeeAccess(employeeId) {
        return this.rbacService.getEmployeeAccess(employeeId);
    }
    setEmployeeOverride(employeeId, permissionId, dto, user) {
        return this.rbacService.setEmployeeOverride(employeeId, permissionId, dto.state, user.id);
    }
    resetEmployeeOverride(employeeId, permissionId, user) {
        return this.rbacService.resetEmployeeOverride(employeeId, permissionId, user.id);
    }
    resetAllEmployeeOverrides(employeeId, user) {
        return this.rbacService.resetAllEmployeeOverrides(employeeId, user.id);
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getMyAccess", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getRole", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Role'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "createRole", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Role'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Put)('roles/:id/permissions'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('RolePermission'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_permissions_dto_1.AssignPermissionsDto]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "setRolePermissions", null);
__decorate([
    (0, common_1.Get)('users/:userId/roles'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'VIEW'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getUserRoles", null);
__decorate([
    (0, common_1.Put)('users/:userId/roles'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('UserRole'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_roles_dto_1.AssignRolesDto, Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "setUserRoles", null);
__decorate([
    (0, common_1.Get)('employees/:employeeId/access'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'VIEW'),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getEmployeeAccess", null);
__decorate([
    (0, common_1.Put)('employees/:employeeId/overrides/:permissionId'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('EmployeePermissionOverride'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, set_employee_override_dto_1.SetEmployeeOverrideDto, Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "setEmployeeOverride", null);
__decorate([
    (0, common_1.Delete)('employees/:employeeId/overrides/:permissionId'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('EmployeePermissionOverride'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "resetEmployeeOverride", null);
__decorate([
    (0, common_1.Post)('employees/:employeeId/overrides/reset-all'),
    (0, require_permission_decorator_1.RequirePermission)('rbac', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('EmployeePermissionOverride'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "resetAllEmployeeOverrides", null);
exports.RbacController = RbacController = __decorate([
    (0, common_1.Controller)('rbac'),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map