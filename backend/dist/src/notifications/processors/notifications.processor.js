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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../services/notifications.service");
const events_gateway_1 = require("../../common/websocket/events.gateway");
let NotificationsProcessor = class NotificationsProcessor extends bullmq_1.WorkerHost {
    notificationsService;
    eventsGateway;
    constructor(notificationsService, eventsGateway) {
        super();
        this.notificationsService = notificationsService;
        this.eventsGateway = eventsGateway;
    }
    async process(job) {
        const data = job.data;
        if (data.channel === client_1.NotificationChannel.IN_APP) {
            await this.notificationsService.createInAppRecord(data);
            this.eventsGateway.emitToUser(data.userId, 'notification:new', {
                eventType: data.eventType,
                title: data.title,
                message: data.message,
                data: data.data,
            });
            return;
        }
        this.notificationsService.logStubDelivery(data);
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
exports.NotificationsProcessor = NotificationsProcessor = __decorate([
    (0, bullmq_1.Processor)(notifications_service_1.NOTIFICATIONS_QUEUE),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        events_gateway_1.EventsGateway])
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map