import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../common/decorators/audit-entity.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // -- Company profile -----------------------------------------------

  @Get('company')
  @RequirePermission('organization', 'VIEW')
  getCompanyProfile() {
    return this.organizationService.getCompanyProfile();
  }

  @Patch('company')
  @RequirePermission('organization', 'EDIT')
  @AuditEntity('CompanyProfile')
  updateCompanyProfile(@Body() dto: UpdateCompanyProfileDto) {
    return this.organizationService.updateCompanyProfile(dto);
  }

  // -- Branches ---------------------------------------------------------

  @Get('branches')
  @RequirePermission('organization', 'VIEW')
  listBranches(@Query() query: PaginationQueryDto) {
    return this.organizationService.listBranches(query);
  }

  @Post('branches')
  @RequirePermission('organization', 'CREATE')
  @AuditEntity('Branch')
  createBranch(@Body() dto: CreateBranchDto) {
    return this.organizationService.createBranch(dto);
  }

  @Get('branches/:id')
  @RequirePermission('organization', 'VIEW')
  getBranch(@Param('id') id: string) {
    return this.organizationService.getBranch(id);
  }

  @Patch('branches/:id')
  @RequirePermission('organization', 'EDIT')
  @AuditEntity('Branch')
  updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.organizationService.updateBranch(id, dto);
  }

  @Delete('branches/:id')
  @RequirePermission('organization', 'DELETE')
  @AuditEntity('Branch')
  deleteBranch(@Param('id') id: string) {
    return this.organizationService.deleteBranch(id);
  }

  // -- Departments (with hierarchy) --------------------------------------

  @Get('departments/tree')
  @RequirePermission('organization', 'VIEW')
  getDepartmentTree() {
    return this.organizationService.getDepartmentTree();
  }

  @Get('departments')
  @RequirePermission('organization', 'VIEW')
  listDepartments(@Query() query: ListDepartmentsQueryDto) {
    return this.organizationService.listDepartments(query, query.branchId);
  }

  @Post('departments')
  @RequirePermission('organization', 'CREATE')
  @AuditEntity('Department')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Get('departments/:id')
  @RequirePermission('organization', 'VIEW')
  getDepartment(@Param('id') id: string) {
    return this.organizationService.getDepartment(id);
  }

  @Patch('departments/:id')
  @RequirePermission('organization', 'EDIT')
  @AuditEntity('Department')
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.organizationService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @RequirePermission('organization', 'DELETE')
  @AuditEntity('Department')
  deleteDepartment(@Param('id') id: string) {
    return this.organizationService.deleteDepartment(id);
  }

  // -- Company holidays ---------------------------------------------------

  @Get('holidays')
  @RequirePermission('organization', 'VIEW')
  listHolidays(@Query() query: PaginationQueryDto) {
    return this.organizationService.listHolidays(query);
  }

  @Post('holidays')
  @RequirePermission('organization', 'CREATE')
  @AuditEntity('CompanyHoliday')
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.organizationService.createHoliday(dto);
  }

  @Patch('holidays/:id')
  @RequirePermission('organization', 'EDIT')
  @AuditEntity('CompanyHoliday')
  updateHoliday(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.organizationService.updateHoliday(id, dto);
  }

  @Delete('holidays/:id')
  @RequirePermission('organization', 'DELETE')
  @AuditEntity('CompanyHoliday')
  deleteHoliday(@Param('id') id: string) {
    return this.organizationService.deleteHoliday(id);
  }
}
