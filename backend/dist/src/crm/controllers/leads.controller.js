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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("../services/leads.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const create_lead_dto_1 = require("../dto/create-lead.dto");
const update_lead_dto_1 = require("../dto/update-lead.dto");
const list_leads_query_dto_1 = require("../dto/list-leads-query.dto");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    listLeads(query) {
        return this.leadsService.listLeads(query);
    }
    createLead(dto) {
        return this.leadsService.createLead(dto);
    }
    getLead(id) {
        return this.leadsService.getLead(id);
    }
    updateLead(id, dto) {
        return this.leadsService.updateLead(id, dto);
    }
    deleteLead(id) {
        return this.leadsService.deleteLead(id);
    }
    convertLead(id) {
        return this.leadsService.convertLead(id);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_leads_query_dto_1.ListLeadsQueryDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "listLeads", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Lead'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "getLead", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Lead'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_dto_1.UpdateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Lead'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "deleteLead", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Lead'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "convertLead", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.Controller)('crm/leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map