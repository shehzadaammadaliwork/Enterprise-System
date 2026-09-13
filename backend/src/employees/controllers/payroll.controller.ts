import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PayrollService } from '../services/payroll.service';
import { EmployeesService } from '../services/employees.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TriggerPayrollRunDto } from '../dto/trigger-payroll-run.dto';
import { SetPayrollAdjustmentsDto } from '../dto/set-payroll-adjustments.dto';
import { ListPayrollAdjustmentsQueryDto } from '../dto/list-payroll-adjustments-query.dto';

@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Get('me')
  async getMyPayslips(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.payrollService.getPayslipsForEmployee(employee.id, query);
  }

  @Get('adjustments')
  @RequirePermission('payroll', 'VIEW')
  getAdjustments(@Query() query: ListPayrollAdjustmentsQueryDto) {
    const employeeIds = query.employeeIds
      ? query.employeeIds.split(',').filter(Boolean)
      : undefined;
    return this.payrollService.getAdjustments(
      query.month,
      query.year,
      employeeIds,
    );
  }

  @Put('adjustments')
  @RequirePermission('payroll', 'EDIT')
  @AuditEntity('PayrollAdjustment')
  setAdjustments(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetPayrollAdjustmentsDto,
  ) {
    return this.payrollService.setAdjustments(dto, user.id);
  }

  @Post('runs')
  @RequirePermission('payroll', 'CREATE')
  @AuditEntity('PayrollRun')
  triggerRun(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TriggerPayrollRunDto,
  ) {
    return this.payrollService.triggerRun(
      dto.month,
      dto.year,
      user.id,
      dto.scope,
      dto.employeeIds,
    );
  }

  @Get('runs')
  @RequirePermission('payroll', 'VIEW')
  listRuns(@Query() query: PaginationQueryDto) {
    return this.payrollService.listRuns(query);
  }

  @Get('runs/:id')
  @RequirePermission('payroll', 'VIEW')
  getRun(@Param('id') id: string) {
    return this.payrollService.getRun(id);
  }
}
