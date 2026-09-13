import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LeaveService } from '../services/leave.service';
import { EmployeesService } from '../services/employees.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { ListLeaveRequestsQueryDto } from '../dto/list-leave-requests-query.dto';

@Controller('leave-requests')
export class LeaveController {
  constructor(
    private readonly leaveService: LeaveService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post()
  @AuditEntity('LeaveRequest')
  async createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.leaveService.createRequest(employee.id, dto);
  }

  @Get('me')
  async getMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.leaveService.listForEmployee(employee.id, query);
  }

  @Get()
  @RequirePermission('employees', 'VIEW')
  listAll(@Query() query: ListLeaveRequestsQueryDto) {
    return this.leaveService.listAll(query, query.status, query.employeeId);
  }

  @Get(':id')
  @RequirePermission('employees', 'VIEW')
  getRequest(@Param('id') id: string) {
    return this.leaveService.getRequest(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('employees', 'EDIT')
  @AuditEntity('LeaveRequest')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.decide(id, user.id, true);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('employees', 'EDIT')
  @AuditEntity('LeaveRequest')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.decide(id, user.id, false);
  }
}
