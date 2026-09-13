import { NotificationsService } from '../services/notifications.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(user: AuthenticatedUser, query: ListNotificationsQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            message: string;
            userId: string;
            eventType: import("@prisma/client").$Enums.NotificationEventType;
            title: string;
            readAt: Date | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
        unreadCount: number;
    }>;
    unreadCount(user: AuthenticatedUser): Promise<{
        count: number;
    }>;
    getPreferences(user: AuthenticatedUser): Promise<{
        eventType: "LEAVE_REQUEST_SUBMITTED" | "LEAVE_REQUEST_DECIDED" | "PURCHASE_REQUEST_SUBMITTED" | "PURCHASE_REQUEST_DECIDED" | "SYSTEM_ANNOUNCEMENT" | "CALENDAR_EVENT_INVITED" | "CALENDAR_EVENT_REMINDER";
        channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH";
        enabled: boolean;
    }[]>;
    updatePreferences(user: AuthenticatedUser, dto: UpdatePreferencesDto): Promise<{
        eventType: "LEAVE_REQUEST_SUBMITTED" | "LEAVE_REQUEST_DECIDED" | "PURCHASE_REQUEST_SUBMITTED" | "PURCHASE_REQUEST_DECIDED" | "SYSTEM_ANNOUNCEMENT" | "CALENDAR_EVENT_INVITED" | "CALENDAR_EVENT_REMINDER";
        channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH";
        enabled: boolean;
    }[]>;
    markAllRead(user: AuthenticatedUser): Promise<void>;
    markRead(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string;
        userId: string;
        eventType: import("@prisma/client").$Enums.NotificationEventType;
        title: string;
        readAt: Date | null;
    }>;
    markUnread(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        message: string;
        userId: string;
        eventType: import("@prisma/client").$Enums.NotificationEventType;
        title: string;
        readAt: Date | null;
    }>;
    broadcast(dto: BroadcastNotificationDto): Promise<void>;
}
