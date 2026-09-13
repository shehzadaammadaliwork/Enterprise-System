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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("../services/attendance.service");
const employees_service_1 = require("../services/employees.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
let AttendanceController = class AttendanceController {
    attendanceService;
    employeesService;
    constructor(attendanceService, employeesService) {
        this.attendanceService = attendanceService;
        this.employeesService = employeesService;
    }
    async checkIn(user) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.attendanceService.checkIn(employee.id);
    }
    async checkOut(user) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.attendanceService.checkOut(employee.id);
    }
    async getMyHistory(user, query) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.attendanceService.listHistory(employee.id, query);
    }
    getHistory(employeeId, query) {
        return this.attendanceService.listHistory(employeeId, query);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_entity_decorator_1.AuditEntity)('AttendanceRecord'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_entity_decorator_1.AuditEntity)('AttendanceRecord'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getMyHistory", null);
__decorate([
    (0, common_1.Get)(':employeeId'),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'VIEW'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getHistory", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService,
        employees_service_1.EmployeesService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map