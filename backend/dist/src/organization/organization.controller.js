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
exports.OrganizationController = void 0;
const common_1 = require("@nestjs/common");
const organization_service_1 = require("./organization.service");
const require_permission_decorator_1 = require("../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../common/decorators/audit-entity.decorator");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
const update_company_profile_dto_1 = require("./dto/update-company-profile.dto");
const create_branch_dto_1 = require("./dto/create-branch.dto");
const update_branch_dto_1 = require("./dto/update-branch.dto");
const create_department_dto_1 = require("./dto/create-department.dto");
const update_department_dto_1 = require("./dto/update-department.dto");
const create_holiday_dto_1 = require("./dto/create-holiday.dto");
const update_holiday_dto_1 = require("./dto/update-holiday.dto");
const list_departments_query_dto_1 = require("./dto/list-departments-query.dto");
let OrganizationController = class OrganizationController {
    organizationService;
    constructor(organizationService) {
        this.organizationService = organizationService;
    }
    getCompanyProfile() {
        return this.organizationService.getCompanyProfile();
    }
    updateCompanyProfile(dto) {
        return this.organizationService.updateCompanyProfile(dto);
    }
    listBranches(query) {
        return this.organizationService.listBranches(query);
    }
    createBranch(dto) {
        return this.organizationService.createBranch(dto);
    }
    getBranch(id) {
        return this.organizationService.getBranch(id);
    }
    updateBranch(id, dto) {
        return this.organizationService.updateBranch(id, dto);
    }
    deleteBranch(id) {
        return this.organizationService.deleteBranch(id);
    }
    getDepartmentTree() {
        return this.organizationService.getDepartmentTree();
    }
    listDepartments(query) {
        return this.organizationService.listDepartments(query, query.branchId);
    }
    createDepartment(dto) {
        return this.organizationService.createDepartment(dto);
    }
    getDepartment(id) {
        return this.organizationService.getDepartment(id);
    }
    updateDepartment(id, dto) {
        return this.organizationService.updateDepartment(id, dto);
    }
    deleteDepartment(id) {
        return this.organizationService.deleteDepartment(id);
    }
    listHolidays(query) {
        return this.organizationService.listHolidays(query);
    }
    createHoliday(dto) {
        return this.organizationService.createHoliday(dto);
    }
    updateHoliday(id, dto) {
        return this.organizationService.updateHoliday(id, dto);
    }
    deleteHoliday(id) {
        return this.organizationService.deleteHoliday(id);
    }
};
exports.OrganizationController = OrganizationController;
__decorate([
    (0, common_1.Get)('company'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getCompanyProfile", null);
__decorate([
    (0, common_1.Patch)('company'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('CompanyProfile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_company_profile_dto_1.UpdateCompanyProfileDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateCompanyProfile", null);
__decorate([
    (0, common_1.Get)('branches'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "listBranches", null);
__decorate([
    (0, common_1.Post)('branches'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Branch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_branch_dto_1.CreateBranchDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Get)('branches/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getBranch", null);
__decorate([
    (0, common_1.Patch)('branches/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Branch'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_branch_dto_1.UpdateBranchDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Delete)('branches/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Branch'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "deleteBranch", null);
__decorate([
    (0, common_1.Get)('departments/tree'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getDepartmentTree", null);
__decorate([
    (0, common_1.Get)('departments'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_departments_query_dto_1.ListDepartmentsQueryDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "listDepartments", null);
__decorate([
    (0, common_1.Post)('departments'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Department'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_department_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Get)('departments/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "getDepartment", null);
__decorate([
    (0, common_1.Patch)('departments/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_department_dto_1.UpdateDepartmentDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateDepartment", null);
__decorate([
    (0, common_1.Delete)('departments/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Department'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "deleteDepartment", null);
__decorate([
    (0, common_1.Get)('holidays'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "listHolidays", null);
__decorate([
    (0, common_1.Post)('holidays'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('CompanyHoliday'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_holiday_dto_1.CreateHolidayDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "createHoliday", null);
__decorate([
    (0, common_1.Patch)('holidays/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('CompanyHoliday'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_holiday_dto_1.UpdateHolidayDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateHoliday", null);
__decorate([
    (0, common_1.Delete)('holidays/:id'),
    (0, require_permission_decorator_1.RequirePermission)('organization', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('CompanyHoliday'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "deleteHoliday", null);
exports.OrganizationController = OrganizationController = __decorate([
    (0, common_1.Controller)('organization'),
    __metadata("design:paramtypes", [organization_service_1.OrganizationService])
], OrganizationController);
//# sourceMappingURL=organization.controller.js.map