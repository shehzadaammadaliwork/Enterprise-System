import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { ListActivitiesQueryDto } from '../dto/list-activities-query.dto';

@Controller('crm/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @RequirePermission('crm', 'VIEW')
  listActivities(@Query() query: ListActivitiesQueryDto) {
    return this.activitiesService.listActivities(query);
  }

  @Post()
  @RequirePermission('crm', 'CREATE')
  @AuditEntity('Activity')
  createActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivity(dto, user.id);
  }
}
