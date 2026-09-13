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
exports.MyPerformanceReviewController = exports.PerformanceReviewController = void 0;
const common_1 = require("@nestjs/common");
const performance_review_service_1 = require("../services/performance-review.service");
const employees_service_1 = require("../services/employees.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const create_performance_review_dto_1 = require("../dto/create-performance-review.dto");
let PerformanceReviewController = class PerformanceReviewController {
    performanceReviewService;
    constructor(performanceReviewService) {
        this.performanceReviewService = performanceReviewService;
    }
    create(employeeId, user, dto) {
        return this.performanceReviewService.createReview(employeeId, user.id, dto);
    }
    list(employeeId, query) {
        return this.performanceReviewService.listForEmployee(employeeId, query);
    }
};
exports.PerformanceReviewController = PerformanceReviewController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('PerformanceReview'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_performance_review_dto_1.CreatePerformanceReviewDto]),
    __metadata("design:returntype", void 0)
], PerformanceReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'VIEW'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], PerformanceReviewController.prototype, "list", null);
exports.PerformanceReviewController = PerformanceReviewController = __decorate([
    (0, common_1.Controller)('employees/:employeeId/performance-reviews'),
    __metadata("design:paramtypes", [performance_review_service_1.PerformanceReviewService])
], PerformanceReviewController);
let MyPerformanceReviewController = class MyPerformanceReviewController {
    performanceReviewService;
    employeesService;
    constructor(performanceReviewService, employeesService) {
        this.performanceReviewService = performanceReviewService;
        this.employeesService = employeesService;
    }
    async getMine(user, query) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.performanceReviewService.listForEmployee(employee.id, query);
    }
};
exports.MyPerformanceReviewController = MyPerformanceReviewController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], MyPerformanceReviewController.prototype, "getMine", null);
exports.MyPerformanceReviewController = MyPerformanceReviewController = __decorate([
    (0, common_1.Controller)('performance-reviews'),
    __metadata("design:paramtypes", [performance_review_service_1.PerformanceReviewService,
        employees_service_1.EmployeesService])
], MyPerformanceReviewController);
//# sourceMappingURL=performance-review.controller.js.map