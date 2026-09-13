import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PerformanceReviewService } from '../services/performance-review.service';
import { EmployeesService } from '../services/employees.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreatePerformanceReviewDto } from '../dto/create-performance-review.dto';

@Controller('employees/:employeeId/performance-reviews')
export class PerformanceReviewController {
  constructor(
    private readonly performanceReviewService: PerformanceReviewService,
  ) {}

  @Post()
  @RequirePermission('employees', 'CREATE')
  @AuditEntity('PerformanceReview')
  create(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePerformanceReviewDto,
  ) {
    return this.performanceReviewService.createReview(employeeId, user.id, dto);
  }

  @Get()
  @RequirePermission('employees', 'VIEW')
  list(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.performanceReviewService.listForEmployee(employeeId, query);
  }
}

@Controller('performance-reviews')
export class MyPerformanceReviewController {
  constructor(
    private readonly performanceReviewService: PerformanceReviewService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Get('me')
  async getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    const employee = await this.employeesService.getEmployeeByUserId(user.id);
    return this.performanceReviewService.listForEmployee(employee.id, query);
  }
}
