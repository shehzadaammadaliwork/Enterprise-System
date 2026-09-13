import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { EmployeesService } from '../services/employees.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @AuditEntity('AttendanceRecord')
  async checkIn(@CurrentUser() user: AuthenticatedUser) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.attendanceService.checkIn(employee.id);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @AuditEntity('AttendanceRecord')
  async checkOut(@CurrentUser() user: AuthenticatedUser) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.attendanceService.checkOut(employee.id);
  }

  @Get('me')
  async getMyHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.attendanceService.listHistory(employee.id, query);
  }

  @Get(':employeeId')
  @RequirePermission('employees', 'VIEW')
  getHistory(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.attendanceService.listHistory(employeeId, query);
  }
}
