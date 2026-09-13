import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/// No @RequirePermission — self-service like /employees/me. Per-section
/// gating happens inside DashboardService itself, since the sections a
/// caller sees depend on which of several different permissions they hold,
/// not one single permission this route could declare.
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getSummary(user.id);
  }
}
