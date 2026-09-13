import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CalendarEventsService } from '../services/calendar-events.service';
interface ReminderJobData {
    eventId: string;
}
export declare class CalendarReminderProcessor extends WorkerHost {
    private readonly calendarEventsService;
    constructor(calendarEventsService: CalendarEventsService);
    process(job: Job<ReminderJobData>): Promise<void>;
}
export {};
