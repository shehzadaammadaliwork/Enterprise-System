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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("../services/payroll.service");
const employees_service_1 = require("../services/employees.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const trigger_payroll_run_dto_1 = require("../dto/trigger-payroll-run.dto");
const set_payroll_adjustments_dto_1 = require("../dto/set-payroll-adjustments.dto");
const list_payroll_adjustments_query_dto_1 = require("../dto/list-payroll-adjustments-query.dto");
let PayrollController = class PayrollController {
    payrollService;
    employeesService;
    constructor(payrollService, employeesService) {
        this.payrollService = payrollService;
        this.employeesService = employeesService;
    }
    async getMyPayslips(user, query) {
        const employee = await this.employeesService.getEmployeeByUserId(user.id);
        return this.payrollService.getPayslipsForEmployee(employee.id, query);
    }
    getAdjustments(query) {
        const employeeIds = query.employeeIds
            ? query.employeeIds.split(',').filter(Boolean)
            : undefined;
        return this.payrollService.getAdjustments(query.month, query.year, employeeIds);
    }
    setAdjustments(user, dto) {
        return this.payrollService.setAdjustments(dto, user.id);
    }
    triggerRun(user, dto) {
        return this.payrollService.triggerRun(dto.month, dto.year, user.id, dto.scope, dto.employeeIds);
    }
    listRuns(query) {
        return this.payrollService.listRuns(query);
    }
    getRun(id) {
        return this.payrollService.getRun(id);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getMyPayslips", null);
__decorate([
    (0, common_1.Get)('adjustments'),
    (0, require_permission_decorator_1.RequirePermission)('payroll', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_payroll_adjustments_query_dto_1.ListPayrollAdjustmentsQueryDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getAdjustments", null);
__decorate([
    (0, common_1.Put)('adjustments'),
    (0, require_permission_decorator_1.RequirePermission)('payroll', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('PayrollAdjustment'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, set_payroll_adjustments_dto_1.SetPayrollAdjustmentsDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "setAdjustments", null);
__decorate([
    (0, common_1.Post)('runs'),
    (0, require_permission_decorator_1.RequirePermission)('payroll', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('PayrollRun'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, trigger_payroll_run_dto_1.TriggerPayrollRunDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "triggerRun", null);
__decorate([
    (0, common_1.Get)('runs'),
    (0, require_permission_decorator_1.RequirePermission)('payroll', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "listRuns", null);
__decorate([
    (0, common_1.Get)('runs/:id'),
    (0, require_permission_decorator_1.RequirePermission)('payroll', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getRun", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService,
        employees_service_1.EmployeesService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map