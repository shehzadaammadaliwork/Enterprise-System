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
exports.CalendarReminderProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const calendar_events_service_1 = require("../services/calendar-events.service");
let CalendarReminderProcessor = class CalendarReminderProcessor extends bullmq_1.WorkerHost {
    calendarEventsService;
    constructor(calendarEventsService) {
        super();
        this.calendarEventsService = calendarEventsService;
    }
    async process(job) {
        await this.calendarEventsService.dispatchReminder(job.data.eventId);
    }
};
exports.CalendarReminderProcessor = CalendarReminderProcessor;
exports.CalendarReminderProcessor = CalendarReminderProcessor = __decorate([
    (0, bullmq_1.Processor)(calendar_events_service_1.CALENDAR_REMINDER_QUEUE),
    __metadata("design:paramtypes", [calendar_events_service_1.CalendarEventsService])
], CalendarReminderProcessor);
//# sourceMappingURL=calendar-reminder.processor.js.map