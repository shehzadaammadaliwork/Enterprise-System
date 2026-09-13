import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmployeesService } from '../services/employees.service';
import { RbacService } from '../../rbac/rbac.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { ListEmployeesQueryDto } from '../dto/list-employees-query.dto';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly rbacService: RbacService,
  ) {}

  /// `employees:VIEW/CREATE/EDIT/DELETE` gate the general directory; seeing
  /// decrypted salary in a directory response additionally requires
  /// `payroll:VIEW` (Module 7 hardening pass — split out so a directory-only
  /// role can't incidentally see everyone's pay).
  private canViewSalary(userId: string): Promise<boolean> {
    return this.rbacService.userHasPermission(userId, 'payroll', 'VIEW');
  }

  /// Mirrors canViewSalary but for writes: `employees:EDIT` alone lets a
  /// caller update department/designation/etc, but changing compensation
  /// specifically requires `payroll:EDIT` — the same split rationale as
  /// view access (Module 7 hardening pass), just applied to the mutation
  /// path instead of the read path.
  private canEditSalary(userId: string): Promise<boolean> {
    return this.rbacService.userHasPermission(userId, 'payroll', 'EDIT');
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.getEmployeeByUserId(user.id);
  }

  @Get()
  @RequirePermission('employees', 'VIEW')
  async listEmployees(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListEmployeesQueryDto,
  ) {
    const includeSalary = await this.canViewSalary(user.id);
    return this.employeesService.listEmployees(
      query,
      query.departmentId,
      includeSalary,
      query.status,
    );
  }

  @Post()
  @RequirePermission('employees', 'CREATE')
  @AuditEntity('Employee')
  async createEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    const includeSalary = await this.canViewSalary(user.id);
    const employee = await this.employeesService.createEmployee(
      dto,
      includeSalary,
    );
    // Role assignment lives on User (RbacService.setUserRoles), not
    // Employee — CreateEmployeeDto.roleIds requires at least one (spec
    // Section 2's hard "must select a role" validation), so every new
    // employee's linked User account gets its initial role set here, right
    // after the profile itself is created.
    await this.rbacService.setUserRoles(dto.userId, dto.roleIds);
    return employee;
  }

  @Get(':id')
  @RequirePermission('employees', 'VIEW')
  async getEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const includeSalary = await this.canViewSalary(user.id);
    return this.employeesService.getEmployee(id, includeSalary);
  }

  @Patch(':id')
  @RequirePermission('employees', 'EDIT')
  @AuditEntity('Employee')
  async updateEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    if (dto.salary !== undefined && !(await this.canEditSalary(user.id))) {
      throw new ForbiddenException(
        'Editing salary requires payroll edit permission.',
      );
    }
    const includeSalary = await this.canViewSalary(user.id);
    return this.employeesService.updateEmployee(id, dto, includeSalary);
  }

  @Delete(':id')
  @RequirePermission('employees', 'DELETE')
  @AuditEntity('Employee')
  async deactivateEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const includeSalary = await this.canViewSalary(user.id);
    return this.employeesService.deactivateEmployee(id, includeSalary);
  }
}
