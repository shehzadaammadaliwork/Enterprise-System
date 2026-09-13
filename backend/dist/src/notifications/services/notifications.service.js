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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = exports.NOTIFICATIONS_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const auth_service_1 = require("../../auth/auth.service");
exports.NOTIFICATIONS_QUEUE = 'notifications';
const ALL_CHANNELS = Object.values(client_1.NotificationChannel);
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    authService;
    queue;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, authService, queue) {
        this.prisma = prisma;
        this.authService = authService;
        this.queue = queue;
    }
    async notify(userId, eventType, title, message, data) {
        const prefs = await this.prisma.notificationPreference.findMany({
            where: { userId, eventType },
        });
        const disabled = new Set(prefs.filter((p) => !p.enabled).map((p) => p.channel));
        const enabledChannels = ALL_CHANNELS.filter((c) => !disabled.has(c));
        await Promise.all(enabledChannels.map((channel) => this.queue.add(channel, {
            userId,
            eventType,
            channel,
            title,
            message,
            data,
        })));
    }
    async broadcast(title, message) {
        const userIds = await this.authService.listActiveUserIds();
        await Promise.all(userIds.map((userId) => this.notify(userId, client_1.NotificationEventType.SYSTEM_ANNOUNCEMENT, title, message)));
    }
    async createInAppRecord(data) {
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
    async listForUser(userId, query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
            unreadCount,
        };
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({ where: { userId, readAt: null } });
    }
    async getOwnedOrThrow(id, userId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification || notification.userId !== userId) {
            throw new app_exception_1.AppException('NOTIFICATION_NOT_FOUND', 'Notification not found.', common_1.HttpStatus.NOT_FOUND);
        }
        return notification;
    }
    async markRead(id, userId) {
        await this.getOwnedOrThrow(id, userId);
        return this.prisma.notification.update({
            where: { id },
            data: { readAt: new Date() },
        });
    }
    async markUnread(id, userId) {
        await this.getOwnedOrThrow(id, userId);
        return this.prisma.notification.update({
            where: { id },
            data: { readAt: null },
        });
    }
    async markAllRead(userId) {
        await this.prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
    }
    async getPreferences(userId) {
        const rows = await this.prisma.notificationPreference.findMany({
            where: { userId },
        });
        const rowMap = new Map(rows.map((r) => [`${r.eventType}:${r.channel}`, r.enabled]));
        const eventTypes = Object.values(client_1.NotificationEventType);
        return eventTypes.flatMap((eventType) => ALL_CHANNELS.map((channel) => ({
            eventType,
            channel,
            enabled: rowMap.get(`${eventType}:${channel}`) ?? true,
        })));
    }
    async updatePreferences(userId, dto) {
        await this.prisma.$transaction(dto.preferences.map((entry) => this.prisma.notificationPreference.upsert({
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
        })));
        return this.getPreferences(userId);
    }
    logStubDelivery(data) {
        this.logger.log(`[stub] ${data.channel} notification to user ${data.userId}: "${data.title}"`);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(exports.NOTIFICATIONS_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        bullmq_2.Queue])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map