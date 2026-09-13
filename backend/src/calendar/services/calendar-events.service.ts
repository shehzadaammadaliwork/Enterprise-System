import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CalendarEventType, NotificationEventType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import { OrganizationService } from '../../organization/organization.service';
import { LeaveService } from '../../employees/services/leave.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { ListCalendarEventsQueryDto } from '../dto/list-calendar-events-query.dto';

export const CALENDAR_REMINDER_QUEUE = 'calendar-reminders';
const REMINDER_JOB_NAME = 'reminder';

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
  /// Whether this row is a real CalendarEvent (editable/deletable) or a
  /// synthetic LEAVE/HOLIDAY entry merged in read-only from another module
  /// — see this module's schema header comment for why those aren't
  /// duplicated into calendar_events.
  readOnly: boolean;
}

interface StoredCalendarEvent {
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
  attendees: { userId: string }[];
}

function toView(event: StoredCalendarEvent): CalendarEventView {
  return {
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    location: event.location,
    departmentId: event.departmentId,
    reminderMinutesBefore: event.reminderMinutesBefore,
    attendeeUserIds: event.attendees.map((a) => a.userId),
    readOnly: false,
  };
}

@Injectable()
export class CalendarEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationService: OrganizationService,
    private readonly leaveService: LeaveService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(CALENDAR_REMINDER_QUEUE) private readonly queue: Queue,
  ) {}

  async listEvents(
    query: ListCalendarEventsQueryDto,
  ): Promise<CalendarEventView[]> {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);
    if (dateTo < dateFrom) {
      throw new AppException(
        'INVALID_DATE_RANGE',
        'dateTo must be on or after dateFrom.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [meetingsAndDeadlines, holidays, approvedLeave] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          startAt: { lte: dateTo },
          endAt: { gte: dateFrom },
          ...(query.departmentId
            ? {
                OR: [
                  { departmentId: query.departmentId },
                  { departmentId: null },
                ],
              }
            : {}),
        },
        include: { attendees: true },
        orderBy: { startAt: 'asc' },
      }),
      this.organizationService.listHolidaysInRange(dateFrom, dateTo),
      this.leaveService.listApprovedInRange(
        dateFrom,
        dateTo,
        query.departmentId,
      ),
    ]);

    const views: CalendarEventView[] = [
      ...meetingsAndDeadlines.map(toView),
      ...holidays.map((holiday) => ({
        id: `holiday:${holiday.id}`,
        eventType: CalendarEventType.HOLIDAY,
        title: holiday.name,
        description: holiday.description,
        startAt: holiday.date,
        endAt: holiday.date,
        allDay: true,
        location: null,
        departmentId: null,
        reminderMinutesBefore: null,
        attendeeUserIds: [],
        readOnly: true,
      })),
      ...approvedLeave.map((leave) => ({
        id: `leave:${leave.id}`,
        eventType: CalendarEventType.LEAVE,
        title: `${leave.employee.user.firstName} ${leave.employee.user.lastName} — ${leave.leaveType.toLowerCase()} leave`,
        description: leave.reason,
        startAt: leave.startDate,
        endAt: leave.endDate,
        allDay: true,
        location: null,
        departmentId: leave.employee.departmentId,
        reminderMinutesBefore: null,
        attendeeUserIds: [leave.employee.userId],
        readOnly: true,
      })),
    ];

    return views.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  /// Exported for DashboardService (Personal widgets fix) — "My Upcoming
  /// Events": real events (not the synthetic holiday/leave rows listEvents
  /// merges in — leave already has its own Personal sub-widget, and a
  /// holiday isn't really "mine") this user created or was invited to,
  /// from now onward.
  async listUpcomingForUser(
    userId: string,
    limit = 5,
  ): Promise<CalendarEventView[]> {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        startAt: { gte: new Date() },
        OR: [{ createdByUserId: userId }, { attendees: { some: { userId } } }],
      },
      include: { attendees: true },
      orderBy: { startAt: 'asc' },
      take: limit,
    });
    return events.map(toView);
  }

  private async getEventOrThrow(id: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: { attendees: true },
    });
    if (!event)
      throw new AppException(
        'CALENDAR_EVENT_NOT_FOUND',
        'Calendar event not found.',
        HttpStatus.NOT_FOUND,
      );
    return event;
  }

  async getEvent(id: string): Promise<CalendarEventView> {
    return toView(await this.getEventOrThrow(id));
  }

  async createEvent(createdByUserId: string, dto: CreateCalendarEventDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt < startAt) {
      throw new AppException(
        'INVALID_EVENT_RANGE',
        'endAt must be on or after startAt.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const attendeeUserIds = Array.from(new Set(dto.attendeeUserIds ?? []));
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        startAt,
        endAt,
        allDay: dto.allDay ?? false,
        location: dto.location,
        departmentId: dto.departmentId,
        reminderMinutesBefore: dto.reminderMinutesBefore,
        createdByUserId,
        attendees: {
          create: attendeeUserIds.map((userId) => ({ userId })),
        },
      },
      include: { attendees: true },
    });

    await this.notifyInvited(event.id, event.title, startAt, attendeeUserIds);
    await this.scheduleReminder(event.id, startAt, dto.reminderMinutesBefore);

    return toView(event);
  }

  async updateEvent(id: string, dto: UpdateCalendarEventDto) {
    const existing = await this.getEventOrThrow(id);
    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    if (endAt < startAt) {
      throw new AppException(
        'INVALID_EVENT_RANGE',
        'endAt must be on or after startAt.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousAttendeeIds = new Set(
      existing.attendees.map((a) => a.userId),
    );
    const nextAttendeeIds = dto.attendeeUserIds
      ? Array.from(new Set(dto.attendeeUserIds))
      : null;

    const event = await this.prisma.$transaction(async (tx) => {
      if (nextAttendeeIds) {
        await tx.calendarEventAttendee.deleteMany({ where: { eventId: id } });
      }
      return tx.calendarEvent.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          startAt: dto.startAt ? startAt : undefined,
          endAt: dto.endAt ? endAt : undefined,
          allDay: dto.allDay,
          location: dto.location,
          departmentId: dto.departmentId,
          reminderMinutesBefore: dto.reminderMinutesBefore,
          attendees: nextAttendeeIds
            ? { create: nextAttendeeIds.map((userId) => ({ userId })) }
            : undefined,
        },
        include: { attendees: true },
      });
    });

    if (nextAttendeeIds) {
      const newlyAdded = nextAttendeeIds.filter(
        (userId) => !previousAttendeeIds.has(userId),
      );
      await this.notifyInvited(event.id, event.title, startAt, newlyAdded);
    }

    const reminderMinutesBefore =
      dto.reminderMinutesBefore !== undefined
        ? dto.reminderMinutesBefore
        : existing.reminderMinutesBefore;
    await this.scheduleReminder(event.id, startAt, reminderMinutesBefore);

    return toView(event);
  }

  async deleteEvent(id: string) {
    await this.getEventOrThrow(id);
    await this.prisma.calendarEvent.delete({ where: { id } });
    await this.cancelReminder(id);
  }

  private async notifyInvited(
    eventId: string,
    title: string,
    startAt: Date,
    attendeeUserIds: string[],
  ): Promise<void> {
    await Promise.all(
      attendeeUserIds.map((userId) =>
        this.notificationsService.notify(
          userId,
          NotificationEventType.CALENDAR_EVENT_INVITED,
          'New calendar invite',
          `You've been invited to "${title}" on ${startAt.toLocaleString()}.`,
          { calendarEventId: eventId },
        ),
      ),
    );
  }

  /// jobId = eventId makes this idempotent-replace-on-update: adding a job
  /// with the same id BullMQ already has fails, so any existing reminder is
  /// always cancelled first (same "replace, don't accumulate" requirement
  /// PayrollService.triggerRun's own jobId: run.id relies on, just applied
  /// on update too instead of only at creation).
  private async scheduleReminder(
    eventId: string,
    startAt: Date,
    reminderMinutesBefore: number | null | undefined,
  ): Promise<void> {
    await this.cancelReminder(eventId);
    if (!reminderMinutesBefore) return;

    const reminderAt = startAt.getTime() - reminderMinutesBefore * 60_000;
    const delay = reminderAt - Date.now();
    if (delay <= 0) return; // reminder time already passed — nothing to schedule

    await this.queue.add(
      REMINDER_JOB_NAME,
      { eventId },
      { jobId: eventId, delay },
    );
  }

  private async cancelReminder(eventId: string): Promise<void> {
    const job = await this.queue.getJob(eventId);
    if (job) await job.remove();
  }

  /// Invoked only by CalendarReminderProcessor.
  async dispatchReminder(eventId: string): Promise<void> {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { attendees: true },
    });
    if (!event) return; // deleted after the job was scheduled — nothing to do

    const recipientIds = Array.from(
      new Set([event.createdByUserId, ...event.attendees.map((a) => a.userId)]),
    );
    await Promise.all(
      recipientIds.map((userId) =>
        this.notificationsService.notify(
          userId,
          NotificationEventType.CALENDAR_EVENT_REMINDER,
          `Upcoming: ${event.title}`,
          `Starts at ${event.startAt.toLocaleString()}.`,
          { calendarEventId: event.id },
        ),
      ),
    );
  }
}
