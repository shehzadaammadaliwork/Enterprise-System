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
import { NotificationsService } from '../services/notifications.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';

/// Every route here except broadcast is self-service (no @RequirePermission)
/// — a user only ever reads/manages their own notifications and
/// preferences, same "no decorator = authenticated, no specific permission"
/// convention as /employees/me.
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listForUser(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService
      .getUnreadCount(user.id)
      .then((count) => ({ count }));
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, dto);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Patch(':id/unread')
  markUnread(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markUnread(id, user.id);
  }

  @Post('broadcast')
  @RequirePermission('notifications', 'CREATE')
  @AuditEntity('NotificationBroadcast')
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto.title, dto.message);
  }
}
