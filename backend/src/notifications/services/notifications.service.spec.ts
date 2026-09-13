import { NotificationChannel, NotificationEventType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { Queue } from 'bullmq';

/// Everything mocked (no real DB/queue), same style as Finance/Documents'
/// service specs. Covers the two rules that matter most: "no preference row
/// means enabled" (both for dispatch and for the preferences-page grid) and
/// that a disabled channel is actually skipped at dispatch time.
describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notificationPreference: { findMany: jest.Mock; upsert: jest.Mock };
    notification: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let authService: { listActiveUserIds: jest.Mock };
  let queue: { add: jest.Mock };

  beforeEach(() => {
    prisma = {
      notificationPreference: { findMany: jest.fn(), upsert: jest.fn() },
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    authService = { listActiveUserIds: jest.fn() };
    queue = { add: jest.fn().mockResolvedValue(undefined) };
    service = new NotificationsService(
      prisma as unknown as PrismaService,
      authService as unknown as AuthService,
      queue as unknown as Queue,
    );
  });

  describe('notify', () => {
    it('enqueues one job per channel when no preference rows exist', async () => {
      prisma.notificationPreference.findMany.mockResolvedValue([]);

      await service.notify(
        'user-1',
        NotificationEventType.LEAVE_REQUEST_DECIDED,
        'Title',
        'Message',
      );

      expect(queue.add).toHaveBeenCalledTimes(4);
      const dispatchedChannels = queue.add.mock.calls.map((c) => c[0]);
      expect(dispatchedChannels.sort()).toEqual(
        Object.values(NotificationChannel).sort(),
      );
    });

    it('skips a channel the user has explicitly disabled for this event type', async () => {
      prisma.notificationPreference.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          eventType: NotificationEventType.LEAVE_REQUEST_DECIDED,
          channel: NotificationChannel.SMS,
          enabled: false,
        },
      ]);

      await service.notify(
        'user-1',
        NotificationEventType.LEAVE_REQUEST_DECIDED,
        'Title',
        'Message',
      );

      const dispatchedChannels = queue.add.mock.calls.map((c) => c[0]);
      expect(dispatchedChannels).not.toContain(NotificationChannel.SMS);
      expect(dispatchedChannels).toHaveLength(3);
    });
  });

  describe('broadcast', () => {
    it('notifies every active user with a SYSTEM_ANNOUNCEMENT event', async () => {
      authService.listActiveUserIds.mockResolvedValue(['u1', 'u2']);
      prisma.notificationPreference.findMany.mockResolvedValue([]);

      await service.broadcast('Holiday', 'Office closed Friday');

      expect(queue.add).toHaveBeenCalledTimes(8); // 2 users x 4 channels
    });
  });

  describe('getPreferences', () => {
    it('defaults every (eventType, channel) pair with no row to enabled: true', async () => {
      prisma.notificationPreference.findMany.mockResolvedValue([
        {
          eventType: NotificationEventType.LEAVE_REQUEST_DECIDED,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
      ]);

      const prefs = await service.getPreferences('user-1');

      const disabledOne = prefs.find(
        (p) =>
          p.eventType === NotificationEventType.LEAVE_REQUEST_DECIDED &&
          p.channel === NotificationChannel.EMAIL,
      );
      const everythingElse = prefs.filter((p) => p !== disabledOne);

      expect(disabledOne?.enabled).toBe(false);
      expect(everythingElse.every((p) => p.enabled === true)).toBe(true);
    });
  });

  describe('markRead / markUnread', () => {
    it('rejects acting on a notification that belongs to another user', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'n1',
        userId: 'someone-else',
      });

      await expect(service.markRead('n1', 'user-1')).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'NOTIFICATION_NOT_FOUND' }),
      });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });
});
