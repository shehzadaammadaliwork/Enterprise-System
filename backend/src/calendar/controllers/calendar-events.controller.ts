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
import { CalendarEventsService } from '../services/calendar-events.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { ListCalendarEventsQueryDto } from '../dto/list-calendar-events-query.dto';

@Controller('calendar/events')
export class CalendarEventsController {
  constructor(private readonly calendarEventsService: CalendarEventsService) {}

  @Get()
  @RequirePermission('calendar', 'VIEW')
  list(@Query() query: ListCalendarEventsQueryDto) {
    return this.calendarEventsService.listEvents(query);
  }

  @Get(':id')
  @RequirePermission('calendar', 'VIEW')
  get(@Param('id') id: string) {
    return this.calendarEventsService.getEvent(id);
  }

  @Post()
  @RequirePermission('calendar', 'CREATE')
  @AuditEntity('CalendarEvent')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarEventsService.createEvent(user.id, dto);
  }

  @Patch(':id')
  @RequirePermission('calendar', 'EDIT')
  @AuditEntity('CalendarEvent')
  update(@Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.calendarEventsService.updateEvent(id, dto);
  }

  @Delete(':id')
  @RequirePermission('calendar', 'DELETE')
  @AuditEntity('CalendarEvent')
  remove(@Param('id') id: string) {
    return this.calendarEventsService.deleteEvent(id);
  }
}
