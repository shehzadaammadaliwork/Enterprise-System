"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const organization_module_1 = require("../organization/organization.module");
const employees_module_1 = require("../employees/employees.module");
const notifications_module_1 = require("../notifications/notifications.module");
const calendar_events_service_1 = require("./services/calendar-events.service");
const calendar_events_controller_1 = require("./controllers/calendar-events.controller");
const calendar_reminder_processor_1 = require("./processors/calendar-reminder.processor");
let CalendarModule = class CalendarModule {
};
exports.CalendarModule = CalendarModule;
exports.CalendarModule = CalendarModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({ name: calendar_events_service_1.CALENDAR_REMINDER_QUEUE }),
            organization_module_1.OrganizationModule,
            employees_module_1.EmployeesModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [calendar_events_controller_1.CalendarEventsController],
        providers: [calendar_events_service_1.CalendarEventsService, calendar_reminder_processor_1.CalendarReminderProcessor],
        exports: [calendar_events_service_1.CalendarEventsService],
    })
], CalendarModule);
//# sourceMappingURL=calendar.module.js.map