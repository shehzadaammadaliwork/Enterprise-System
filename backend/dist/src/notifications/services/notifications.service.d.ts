import { Queue } from 'bullmq';
import { Prisma, NotificationChannel, NotificationEventType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
export declare const NOTIFICATIONS_QUEUE = "notifications";
export interface DispatchJobData {
    userId: string;
    eventType: NotificationEventType;
    channel: NotificationChannel;
    title: string;
    message: string;
    data?: Prisma.InputJsonValue;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly authService;
    private readonly queue;
    private readonly logger;
    constructor(prisma: PrismaService, authService: AuthService, queue: Queue);
    notify(userId: string, eventType: NotificationEventType, title: string, message: string, data?: Prisma.InputJsonValue): Promise<void>;
    broadcast(title: string, message: string): Promise<void>;
    createInAppRecord(data: DispatchJobData): Promise<void>;
    listForUser(userId: string, query: ListNotificationsQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            data: Prisma.JsonValue | null;
            message: string;
            userId: string;
            eventType: import("@prisma/client").$Enums.NotificationEventType;
            title: string;
            readAt: Date | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
        unreadCount: number;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    private getOwnedOrThrow;
    markRead(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        data: Prisma.JsonValue | null;
        message: string;
        userId: string;
        eventType: import("@prisma/client").$Enums.NotificationEventType;
        title: string;
        readAt: Date | null;
    }>;
    markUnread(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        data: Prisma.JsonValue | null;
        message: string;
        userId: string;
        eventType: import("@prisma/client").$Enums.NotificationEventType;
        title: string;
        readAt: Date | null;
    }>;
    markAllRead(userId: string): Promise<void>;
    getPreferences(userId: string): Promise<{
        eventType: "LEAVE_REQUEST_SUBMITTED" | "LEAVE_REQUEST_DECIDED" | "PURCHASE_REQUEST_SUBMITTED" | "PURCHASE_REQUEST_DECIDED" | "SYSTEM_ANNOUNCEMENT" | "CALENDAR_EVENT_INVITED" | "CALENDAR_EVENT_REMINDER";
        channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH";
        enabled: boolean;
    }[]>;
    updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<{
        eventType: "LEAVE_REQUEST_SUBMITTED" | "LEAVE_REQUEST_DECIDED" | "PURCHASE_REQUEST_SUBMITTED" | "PURCHASE_REQUEST_DECIDED" | "SYSTEM_ANNOUNCEMENT" | "CALENDAR_EVENT_INVITED" | "CALENDAR_EVENT_REMINDER";
        channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH";
        enabled: boolean;
    }[]>;
    logStubDelivery(data: DispatchJobData): void;
}
