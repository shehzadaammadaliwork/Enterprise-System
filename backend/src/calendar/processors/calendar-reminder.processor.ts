import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  CALENDAR_REMINDER_QUEUE,
  CalendarEventsService,
} from '../services/calendar-events.service';

interface ReminderJobData {
  eventId: string;
}

/// BullMQ worker for the spec's "reminder notification ahead of event
/// start" requirement — CalendarEventsService.scheduleReminder enqueues a
/// single delayed job here (delay = startAt - reminderMinutesBefore), same
/// delayed-job shape as PayrollProcessor/NotificationsProcessor but with a
/// `delay` instead of firing immediately.
@Processor(CALENDAR_REMINDER_QUEUE)
export class CalendarReminderProcessor extends WorkerHost {
  constructor(private readonly calendarEventsService: CalendarEventsService) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    await this.calendarEventsService.dispatchReminder(job.data.eventId);
  }
}
