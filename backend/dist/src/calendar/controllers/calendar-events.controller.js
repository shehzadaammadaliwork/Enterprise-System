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
exports.CalendarEventsController = void 0;
const common_1 = require("@nestjs/common");
const calendar_events_service_1 = require("../services/calendar-events.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const create_calendar_event_dto_1 = require("../dto/create-calendar-event.dto");
const update_calendar_event_dto_1 = require("../dto/update-calendar-event.dto");
const list_calendar_events_query_dto_1 = require("../dto/list-calendar-events-query.dto");
let CalendarEventsController = class CalendarEventsController {
    calendarEventsService;
    constructor(calendarEventsService) {
        this.calendarEventsService = calendarEventsService;
    }
    list(query) {
        return this.calendarEventsService.listEvents(query);
    }
    get(id) {
        return this.calendarEventsService.getEvent(id);
    }
    create(user, dto) {
        return this.calendarEventsService.createEvent(user.id, dto);
    }
    update(id, dto) {
        return this.calendarEventsService.updateEvent(id, dto);
    }
    remove(id) {
        return this.calendarEventsService.deleteEvent(id);
    }
};
exports.CalendarEventsController = CalendarEventsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('calendar', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_calendar_events_query_dto_1.ListCalendarEventsQueryDto]),
    __metadata("design:returntype", void 0)
], CalendarEventsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('calendar', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CalendarEventsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('calendar', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('CalendarEvent'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_calendar_event_dto_1.CreateCalendarEventDto]),
    __metadata("design:returntype", void 0)
], CalendarEventsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('calendar', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('CalendarEvent'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_calendar_event_dto_1.UpdateCalendarEventDto]),
    __metadata("design:returntype", void 0)
], CalendarEventsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('calendar', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('CalendarEvent'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CalendarEventsController.prototype, "remove", null);
exports.CalendarEventsController = CalendarEventsController = __decorate([
    (0, common_1.Controller)('calendar/events'),
    __metadata("design:paramtypes", [calendar_events_service_1.CalendarEventsService])
], CalendarEventsController);
//# sourceMappingURL=calendar-events.controller.js.map