import { Controller, Get, Query } from '@nestjs/common';
import { EmployeesService } from '../services/employees.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';

/// Read-only listing for the Employee-onboarding flow (the Users page and
/// the "Add employee" user picker) — there's no dedicated `users` module in
/// the fixed RBAC catalog (see common/constants/modules.constant.ts), and
/// this exists solely to support onboarding, so it's gated on
/// `employees:VIEW` like the rest of the employee directory rather than
/// introducing a new permission module for one read-only lookup.
@Controller('users')
export class UsersController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermission('employees', 'VIEW')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.employeesService.listUsers(query);
  }
}
