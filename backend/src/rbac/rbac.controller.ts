import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RequirePermission } from './decorators/require-permission.decorator';
import { AuditEntity } from '../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { SetEmployeeOverrideDto } from './dto/set-employee-override.dto';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  /// No @RequirePermission — every authenticated user can see their own
  /// roles/permissions (needed by the frontend to render role-guarded
  /// routes and widgets), even though viewing *other* users' role
  /// assignments requires rbac:VIEW.
  @Get('me')
  async getMyAccess(@CurrentUser() user: AuthenticatedUser) {
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

  @Get('permissions')
  @RequirePermission('rbac', 'VIEW')
  listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Get('roles')
  @RequirePermission('rbac', 'VIEW')
  listRoles(@Query() query: PaginationQueryDto) {
    return this.rbacService.listRoles(query);
  }

  @Get('roles/:id')
  @RequirePermission('rbac', 'VIEW')
  getRole(@Param('id') id: string) {
    return this.rbacService.getRole(id);
  }

  @Post('roles')
  @RequirePermission('rbac', 'CREATE')
  @AuditEntity('Role')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Patch('roles/:id')
  @RequirePermission('rbac', 'EDIT')
  @AuditEntity('Role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequirePermission('rbac', 'DELETE')
  @AuditEntity('Role')
  deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }

  @Put('roles/:id/permissions')
  @RequirePermission('rbac', 'EDIT')
  @AuditEntity('RolePermission')
  setRolePermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rbacService.setRolePermissions(id, dto.permissionIds);
  }

  @Get('users/:userId/roles')
  @RequirePermission('rbac', 'VIEW')
  getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  /// Security Requirement (Section 13): nobody, including an Admin, may
  /// change their own role assignment through this endpoint — closes a
  /// self-privilege-escalation path. Employee-creation's own internal call
  /// to RbacService.setUserRoles (assigning the employee's initial roles as
  /// part of one atomic creation step) does not go through this endpoint,
  /// so it is unaffected by this check.
  @Put('users/:userId/roles')
  @RequirePermission('rbac', 'EDIT')
  @AuditEntity('UserRole')
  setUserRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (userId === user.id) {
      throw new ForbiddenException({
        code: 'CANNOT_MODIFY_OWN_ACCESS',
        message: 'You cannot modify your own roles or permission overrides.',
      });
    }
    return this.rbacService.setUserRoles(userId, dto.roleIds);
  }

  // ---------------------------------------------------------------------
  // Individual Employee Permission Overrides
  // ---------------------------------------------------------------------

  @Get('employees/:employeeId/access')
  @RequirePermission('rbac', 'VIEW')
  getEmployeeAccess(@Param('employeeId') employeeId: string) {
    return this.rbacService.getEmployeeAccess(employeeId);
  }

  @Put('employees/:employeeId/overrides/:permissionId')
  @RequirePermission('rbac', 'EDIT')
  @AuditEntity('EmployeePermissionOverride')
  setEmployeeOverride(
    @Param('employeeId') employeeId: string,
    @Param('permissionId') permissionId: string,
    @Body() dto: SetEmployeeOverrideDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rbacService.setEmployeeOverride(
      employeeId,
      permissionId,
      dto.state,
      user.id,
    );
  }

  @Delete('employees/:employeeId/overrides/:permissionId')
  @RequirePermission('rbac', 'EDIT')
  @AuditEntity('EmployeePermissionOverride')
  resetEmployeeOverride(
    @Param('employeeId') employeeId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rbacService.resetEmployeeOverride(
      employeeId,
      permissionId,
      user.id,
    );
  }

  @Post('employees/:employeeId/overrides/reset-all')
  @RequirePermission('rbac', 'EDIT')
  @AuditEntity('EmployeePermissionOverride')
  resetAllEmployeeOverrides(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rbacService.resetAllEmployeeOverrides(employeeId, user.id);
  }
}
