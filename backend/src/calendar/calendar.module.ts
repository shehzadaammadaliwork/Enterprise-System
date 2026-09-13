import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrganizationModule } from '../organization/organization.module';
import { EmployeesModule } from '../employees/employees.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  CALENDAR_REMINDER_QUEUE,
  CalendarEventsService,
} from './services/calendar-events.service';
import { CalendarEventsController } from './controllers/calendar-events.controller';
import { CalendarReminderProcessor } from './processors/calendar-reminder.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: CALENDAR_REMINDER_QUEUE }),
    OrganizationModule,
    EmployeesModule,
    NotificationsModule,
  ],
  controllers: [CalendarEventsController],
  providers: [CalendarEventsService, CalendarReminderProcessor],
  exports: [CalendarEventsService],
})
export class CalendarModule {}
