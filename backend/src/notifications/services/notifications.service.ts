import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  Prisma,
  NotificationChannel,
  NotificationEventType,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { AuthService } from '../../auth/auth.service';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';

export const NOTIFICATIONS_QUEUE = 'notifications';

export interface DispatchJobData {
  userId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

/// Every channel is enabled by default until the user opts out (Notification
/// Preference's own doc comment) — this is the "no row yet" fallback used
/// both when checking a single channel and when materializing the full grid
/// for the preferences page.
const ALL_CHANNELS = Object.values(NotificationChannel);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  /// The one shared entry point every other module calls to raise a
  /// notification (Architecture Rule / spec: "dispatched through one shared
  /// service"). Fire-and-forget from the caller's perspective, same shape as
  /// PayrollService.triggerRun — actual delivery happens in
  /// NotificationsProcessor once BullMQ picks the jobs up.
  async notify(
    userId: string,
    eventType: NotificationEventType,
    title: string,
    message: string,
    data?: Prisma.InputJsonValue,
  ): Promise<void> {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { userId, eventType },
    });
    const disabled = new Set(
      prefs.filter((p) => !p.enabled).map((p) => p.channel),
    );
    const enabledChannels = ALL_CHANNELS.filter((c) => !disabled.has(c));

    await Promise.all(
      enabledChannels.map((channel) =>
        this.queue.add(channel, {
          userId,
          eventType,
          channel,
          title,
          message,
          data,
        } satisfies DispatchJobData),
      ),
    );
  }

  /// Company-wide announcement — the one non-1:1 use of notify(), fanned out
  /// to every active user. Invoked from the notifications:CREATE-gated
  /// broadcast endpoint, not from other modules.
  async broadcast(title: string, message: string): Promise<void> {
    const userIds = await this.authService.listActiveUserIds();
    await Promise.all(
      userIds.map((userId) =>
        this.notify(
          userId,
          NotificationEventType.SYSTEM_ANNOUNCEMENT,
          title,
          message,
        ),
      ),
    );
  }

  /// Invoked only by NotificationsProcessor for the IN_APP job — this is
  /// what actually creates the row read/unread state lives on.
  async createInAppRecord(data: DispatchJobData): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        title: data.title,
        message: data.message,
        data: data.data,
      },
    });
  }

  async listForUser(userId: string, query: ListNotificationsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  private async getOwnedOrThrow(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      throw new AppException(
        'NOTIFICATION_NOT_FOUND',
        'Notification not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return notification;
  }

  async markRead(id: string, userId: string) {
    await this.getOwnedOrThrow(id, userId);
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markUnread(id: string, userId: string) {
    await this.getOwnedOrThrow(id, userId);
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: null },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /// Materializes the full (eventType x channel) grid for the preferences
  /// page, filling in `enabled: true` for any combination with no row yet
  /// — the UI should never have to know about the "no row = enabled"
  /// default itself.
  async getPreferences(userId: string) {
    const rows = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });
    const rowMap = new Map(
      rows.map((r) => [`${r.eventType}:${r.channel}`, r.enabled]),
    );
    const eventTypes = Object.values(NotificationEventType);
    return eventTypes.flatMap((eventType) =>
      ALL_CHANNELS.map((channel) => ({
        eventType,
        channel,
        enabled: rowMap.get(`${eventType}:${channel}`) ?? true,
      })),
    );
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    await this.prisma.$transaction(
      dto.preferences.map((entry) =>
        this.prisma.notificationPreference.upsert({
          where: {
            userId_eventType_channel: {
              userId,
              eventType: entry.eventType,
              channel: entry.channel,
            },
          },
          update: { enabled: entry.enabled },
          create: {
            userId,
            eventType: entry.eventType,
            channel: entry.channel,
            enabled: entry.enabled,
          },
        }),
      ),
    );
    return this.getPreferences(userId);
  }

  /// EMAIL/SMS/PUSH have no real provider yet (see this module's schema
  /// header comment) — the processor calls this instead of an actual send,
  /// so the job still completes successfully and the queue stays a true
  /// record of "what would have gone out" once a provider lands.
  logStubDelivery(data: DispatchJobData): void {
    this.logger.log(
      `[stub] ${data.channel} notification to user ${data.userId}: "${data.title}"`,
    );
  }
}
