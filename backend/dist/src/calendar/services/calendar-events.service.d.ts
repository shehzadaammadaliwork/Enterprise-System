import { Queue } from 'bullmq';
import { CalendarEventType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrganizationService } from '../../organization/organization.service';
import { LeaveService } from '../../employees/services/leave.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { ListCalendarEventsQueryDto } from '../dto/list-calendar-events-query.dto';
export declare const CALENDAR_REMINDER_QUEUE = "calendar-reminders";
export interface CalendarEventView {
    id: string;
    eventType: CalendarEventType;
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    location: string | null;
    departmentId: string | null;
    reminderMinutesBefore: number | null;
    attendeeUserIds: string[];
    readOnly: boolean;
}
export declare class CalendarEventsService {
    private readonly prisma;
    private readonly organizationService;
    private readonly leaveService;
    private readonly notificationsService;
    private readonly queue;
    constructor(prisma: PrismaService, organizationService: OrganizationService, leaveService: LeaveService, notificationsService: NotificationsService, queue: Queue);
    listEvents(query: ListCalendarEventsQueryDto): Promise<CalendarEventView[]>;
    listUpcomingForUser(userId: string, limit?: number): Promise<CalendarEventView[]>;
    private getEventOrThrow;
    getEvent(id: string): Promise<CalendarEventView>;
    createEvent(createdByUserId: string, dto: CreateCalendarEventDto): Promise<CalendarEventView>;
    updateEvent(id: string, dto: UpdateCalendarEventDto): Promise<CalendarEventView>;
    deleteEvent(id: string): Promise<void>;
    private notifyInvited;
    private scheduleReminder;
    private cancelReminder;
    dispatchReminder(eventId: string): Promise<void>;
}
