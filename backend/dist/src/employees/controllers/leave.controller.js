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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const leave_service_1 = require("../services/leave.service");
const employees_service_1 = require("../services/employees.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const create_leave_request_dto_1 = require("../dto/create-leave-request.dto");
const list_leave_requests_query_dto_1 = require("../dto/list-leave-requests-query.dto");
let LeaveController = class LeaveController {
    leaveService;
    employeesService;
    constructor(leaveService, employeesService) {
        this.leaveService = leaveService;
        this.employeesService = employeesService;
    }
    async createRequest(user, dto) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.leaveService.createRequest(employee.id, dto);
    }
    async getMyRequests(user, query) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.leaveService.listForEmployee(employee.id, query);
    }
    listAll(query) {
        return this.leaveService.listAll(query, query.status, query.employeeId);
    }
    getRequest(id) {
        return this.leaveService.getRequest(id);
    }
    approve(id, user) {
        return this.leaveService.decide(id, user.id, true);
    }
    reject(id, user) {
        return this.leaveService.decide(id, user.id, false);
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Post)(),
    (0, audit_entity_decorator_1.AuditEntity)('LeaveRequest'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_leave_request_dto_1.CreateLeaveRequestDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_leave_requests_query_dto_1.ListLeaveRequestsQueryDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "listAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('LeaveRequest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('LeaveRequest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "reject", null);
exports.LeaveController = LeaveController = __decorate([
    (0, common_1.Controller)('leave-requests'),
    __metadata("design:paramtypes", [leave_service_1.LeaveService,
        employees_service_1.EmployeesService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map