"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventsService = exports.CALENDAR_REMINDER_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const organization_service_1 = require("../../organization/organization.service");
const leave_service_1 = require("../../employees/services/leave.service");
const notifications_service_1 = require("../../notifications/services/notifications.service");
exports.CALENDAR_REMINDER_QUEUE = 'calendar-reminders';
const REMINDER_JOB_NAME = 'reminder';
function toView(event) {
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
let CalendarEventsService = class CalendarEventsService {
    prisma;
    organizationService;
    leaveService;
    notificationsService;
    queue;
    constructor(prisma, organizationService, leaveService, notificationsService, queue) {
        this.prisma = prisma;
        this.organizationService = organizationService;
        this.leaveService = leaveService;
        this.notificationsService = notificationsService;
        this.queue = queue;
    }
    async listEvents(query) {
        const dateFrom = new Date(query.dateFrom);
        const dateTo = new Date(query.dateTo);
        if (dateTo < dateFrom) {
            throw new app_exception_1.AppException('INVALID_DATE_RANGE', 'dateTo must be on or after dateFrom.', common_1.HttpStatus.BAD_REQUEST);
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
            this.leaveService.listApprovedInRange(dateFrom, dateTo, query.departmentId),
        ]);
        const views = [
            ...meetingsAndDeadlines.map(toView),
            ...holidays.map((holiday) => ({
                id: `holiday:${holiday.id}`,
                eventType: client_1.CalendarEventType.HOLIDAY,
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
                eventType: client_1.CalendarEventType.LEAVE,
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
    async listUpcomingForUser(userId, limit = 5) {
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
    async getEventOrThrow(id) {
        const event = await this.prisma.calendarEvent.findUnique({
            where: { id },
            include: { attendees: true },
        });
        if (!event)
            throw new app_exception_1.AppException('CALENDAR_EVENT_NOT_FOUND', 'Calendar event not found.', common_1.HttpStatus.NOT_FOUND);
        return event;
    }
    async getEvent(id) {
        return toView(await this.getEventOrThrow(id));
    }
    async createEvent(createdByUserId, dto) {
        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);
        if (endAt < startAt) {
            throw new app_exception_1.AppException('INVALID_EVENT_RANGE', 'endAt must be on or after startAt.', common_1.HttpStatus.BAD_REQUEST);
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
    async updateEvent(id, dto) {
        const existing = await this.getEventOrThrow(id);
        const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
        const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
        if (endAt < startAt) {
            throw new app_exception_1.AppException('INVALID_EVENT_RANGE', 'endAt must be on or after startAt.', common_1.HttpStatus.BAD_REQUEST);
        }
        const previousAttendeeIds = new Set(existing.attendees.map((a) => a.userId));
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
            const newlyAdded = nextAttendeeIds.filter((userId) => !previousAttendeeIds.has(userId));
            await this.notifyInvited(event.id, event.title, startAt, newlyAdded);
        }
        const reminderMinutesBefore = dto.reminderMinutesBefore !== undefined
            ? dto.reminderMinutesBefore
            : existing.reminderMinutesBefore;
        await this.scheduleReminder(event.id, startAt, reminderMinutesBefore);
        return toView(event);
    }
    async deleteEvent(id) {
        await this.getEventOrThrow(id);
        await this.prisma.calendarEvent.delete({ where: { id } });
        await this.cancelReminder(id);
    }
    async notifyInvited(eventId, title, startAt, attendeeUserIds) {
        await Promise.all(attendeeUserIds.map((userId) => this.notificationsService.notify(userId, client_1.NotificationEventType.CALENDAR_EVENT_INVITED, 'New calendar invite', `You've been invited to "${title}" on ${startAt.toLocaleString()}.`, { calendarEventId: eventId })));
    }
    async scheduleReminder(eventId, startAt, reminderMinutesBefore) {
        await this.cancelReminder(eventId);
        if (!reminderMinutesBefore)
            return;
        const reminderAt = startAt.getTime() - reminderMinutesBefore * 60_000;
        const delay = reminderAt - Date.now();
        if (delay <= 0)
            return;
        await this.queue.add(REMINDER_JOB_NAME, { eventId }, { jobId: eventId, delay });
    }
    async cancelReminder(eventId) {
        const job = await this.queue.getJob(eventId);
        if (job)
            await job.remove();
    }
    async dispatchReminder(eventId) {
        const event = await this.prisma.calendarEvent.findUnique({
            where: { id: eventId },
            include: { attendees: true },
        });
        if (!event)
            return;
        const recipientIds = Array.from(new Set([event.createdByUserId, ...event.attendees.map((a) => a.userId)]));
        await Promise.all(recipientIds.map((userId) => this.notificationsService.notify(userId, client_1.NotificationEventType.CALENDAR_EVENT_REMINDER, `Upcoming: ${event.title}`, `Starts at ${event.startAt.toLocaleString()}.`, { calendarEventId: event.id })));
    }
};
exports.CalendarEventsService = CalendarEventsService;
exports.CalendarEventsService = CalendarEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)(exports.CALENDAR_REMINDER_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        organization_service_1.OrganizationService,
        leave_service_1.LeaveService,
        notifications_service_1.NotificationsService,
        bullmq_2.Queue])
], CalendarEventsService);
//# sourceMappingURL=calendar-events.service.js.map