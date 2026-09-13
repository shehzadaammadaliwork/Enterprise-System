import { Queue } from 'bullmq';
import { CalendarEventsService } from './calendar-events.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrganizationService } from '../../organization/organization.service';
import { LeaveService } from '../../employees/services/leave.service';
import { NotificationsService } from '../../notifications/services/notifications.service';

/// Everything mocked (no real DB/queue), same style as Finance/Notifications'
/// service specs. Covers the two mechanics unique to this service: reminder
/// scheduling (skipped once the reminder time has already passed) and
/// only-newly-added attendees getting an invite notification on update.
describe('CalendarEventsService', () => {
  let service: CalendarEventsService;
  let prisma: {
    calendarEvent: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    calendarEventAttendee: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let organizationService: { listHolidaysInRange: jest.Mock };
  let leaveService: { listApprovedInRange: jest.Mock };
  let notificationsService: { notify: jest.Mock };
  let queue: { add: jest.Mock; getJob: jest.Mock };

  beforeEach(() => {
    prisma = {
      calendarEvent: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            title: data.title ?? 'Retro',
            attendees: (data.attendees?.create ?? []) as { userId: string }[],
          }),
        ),
        delete: jest.fn(),
      },
      calendarEventAttendee: { deleteMany: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    organizationService = {
      listHolidaysInRange: jest.fn().mockResolvedValue([]),
    };
    leaveService = { listApprovedInRange: jest.fn().mockResolvedValue([]) };
    notificationsService = { notify: jest.fn().mockResolvedValue(undefined) };
    queue = {
      add: jest.fn().mockResolvedValue(undefined),
      getJob: jest.fn().mockResolvedValue(null),
    };
    service = new CalendarEventsService(
      prisma as unknown as PrismaService,
      organizationService as unknown as OrganizationService,
      leaveService as unknown as LeaveService,
      notificationsService as unknown as NotificationsService,
      queue as unknown as Queue,
    );
  });

  describe('createEvent', () => {
    it('rejects endAt before startAt', async () => {
      await expect(
        service.createEvent('user-1', {
          title: 'Standup',
          eventType: 'MEETING',
          startAt: '2026-09-01T10:00:00.000Z',
          endAt: '2026-09-01T09:00:00.000Z',
        } as never),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'INVALID_EVENT_RANGE' }),
      });
      expect(prisma.calendarEvent.create).not.toHaveBeenCalled();
    });

    it('schedules a delayed reminder job when the reminder time is still in the future', async () => {
      const farFutureStart = new Date(Date.now() + 60 * 60_000).toISOString(); // +1h
      prisma.calendarEvent.create.mockResolvedValue({
        id: 'evt-1',
        title: 'Standup',
        attendees: [],
      });

      await service.createEvent('user-1', {
        title: 'Standup',
        eventType: 'MEETING',
        startAt: farFutureStart,
        endAt: farFutureStart,
        reminderMinutesBefore: 15,
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        'reminder',
        { eventId: 'evt-1' },
        expect.objectContaining({ jobId: 'evt-1' }),
      );
    });

    it('does not schedule a reminder once the reminder time has already passed', async () => {
      const nearFutureStart = new Date(Date.now() + 5 * 60_000).toISOString(); // +5min
      prisma.calendarEvent.create.mockResolvedValue({
        id: 'evt-2',
        title: 'Standup',
        attendees: [],
      });

      // reminderMinutesBefore: 15 on a start 5 minutes away means the
      // reminder moment (start - 15min) is already 10 minutes in the past.
      await service.createEvent('user-1', {
        title: 'Standup',
        eventType: 'MEETING',
        startAt: nearFutureStart,
        endAt: nearFutureStart,
        reminderMinutesBefore: 15,
      } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('notifies each attendee of the invite', async () => {
      const farFutureStart = new Date(Date.now() + 60 * 60_000).toISOString();
      prisma.calendarEvent.create.mockResolvedValue({
        id: 'evt-3',
        title: 'Planning',
        attendees: [],
      });

      await service.createEvent('user-1', {
        title: 'Planning',
        eventType: 'MEETING',
        startAt: farFutureStart,
        endAt: farFutureStart,
        attendeeUserIds: ['user-2', 'user-3'],
      } as never);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        'user-2',
        'CALENDAR_EVENT_INVITED',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ calendarEventId: 'evt-3' }),
      );
      expect(notificationsService.notify).toHaveBeenCalledWith(
        'user-3',
        'CALENDAR_EVENT_INVITED',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ calendarEventId: 'evt-3' }),
      );
    });
  });

  describe('updateEvent', () => {
    it('only notifies newly added attendees, not ones already on the event', async () => {
      prisma.calendarEvent.findUnique.mockResolvedValue({
        id: 'evt-4',
        title: 'Retro',
        startAt: new Date(Date.now() + 60 * 60_000),
        endAt: new Date(Date.now() + 60 * 60_000),
        reminderMinutesBefore: null,
        attendees: [{ userId: 'user-2' }],
      });

      await service.updateEvent('evt-4', {
        attendeeUserIds: ['user-2', 'user-4'],
      });

      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        'user-4',
        'CALENDAR_EVENT_INVITED',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ calendarEventId: 'evt-4' }),
      );
    });
  });

  describe('deleteEvent', () => {
    it('rejects deleting an event that does not exist', async () => {
      prisma.calendarEvent.findUnique.mockResolvedValue(null);

      await expect(service.deleteEvent('missing')).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'CALENDAR_EVENT_NOT_FOUND' }),
      });
      expect(prisma.calendarEvent.delete).not.toHaveBeenCalled();
    });
  });

  describe('dispatchReminder', () => {
    it('notifies the creator and every attendee, deduplicated', async () => {
      prisma.calendarEvent.findUnique.mockResolvedValue({
        id: 'evt-5',
        title: 'Standup',
        startAt: new Date(),
        createdByUserId: 'user-1',
        attendees: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });

      await service.dispatchReminder('evt-5');

      expect(notificationsService.notify).toHaveBeenCalledTimes(2);
      const notifiedUserIds = notificationsService.notify.mock.calls.map(
        (c) => c[0],
      );
      expect(notifiedUserIds.sort()).toEqual(['user-1', 'user-2']);
    });

    it('does nothing when the event was deleted after the job was scheduled', async () => {
      prisma.calendarEvent.findUnique.mockResolvedValue(null);

      await service.dispatchReminder('gone');

      expect(notificationsService.notify).not.toHaveBeenCalled();
    });
  });
});
