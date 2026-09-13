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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const employees_service_1 = require("../services/employees.service");
const rbac_service_1 = require("../../rbac/rbac.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const create_employee_dto_1 = require("../dto/create-employee.dto");
const update_employee_dto_1 = require("../dto/update-employee.dto");
const list_employees_query_dto_1 = require("../dto/list-employees-query.dto");
let EmployeesController = class EmployeesController {
    employeesService;
    rbacService;
    constructor(employeesService, rbacService) {
        this.employeesService = employeesService;
        this.rbacService = rbacService;
    }
    canViewSalary(userId) {
        return this.rbacService.userHasPermission(userId, 'payroll', 'VIEW');
    }
    canEditSalary(userId) {
        return this.rbacService.userHasPermission(userId, 'payroll', 'EDIT');
    }
    getMyProfile(user) {
        return this.employeesService.getEmployeeByUserId(user.id);
    }
    async listEmployees(user, query) {
        const includeSalary = await this.canViewSalary(user.id);
        return this.employeesService.listEmployees(query, query.departmentId, includeSalary, query.status);
    }
    async createEmployee(user, dto) {
        const includeSalary = await this.canViewSalary(user.id);
        const employee = await this.employeesService.createEmployee(dto, includeSalary);
        await this.rbacService.setUserRoles(dto.userId, dto.roleIds);
        return employee;
    }
    async getEmployee(user, id) {
        const includeSalary = await this.canViewSalary(user.id);
        return this.employeesService.getEmployee(id, includeSalary);
    }
    async updateEmployee(user, id, dto) {
        if (dto.salary !== undefined && !(await this.canEditSalary(user.id))) {
            throw new common_1.ForbiddenException('Editing salary requires payroll edit permission.');
        }
        const includeSalary = await this.canViewSalary(user.id);
        return this.employeesService.updateEmployee(id, dto, includeSalary);
    }
    async deactivateEmployee(user, id) {
        const includeSalary = await this.canViewSalary(user.id);
        return this.employeesService.deactivateEmployee(id, includeSalary);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'VIEW'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_employees_query_dto_1.ListEmployeesQueryDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "listEmployees", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Employee'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "createEmployee", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'VIEW'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getEmployee", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Employee'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "updateEmployee", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('employees', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Employee'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "deactivateEmployee", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService,
        rbac_service_1.RbacService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map