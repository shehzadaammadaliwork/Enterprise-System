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
exports.DealsController = void 0;
const common_1 = require("@nestjs/common");
const deals_service_1 = require("../services/deals.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const create_deal_dto_1 = require("../dto/create-deal.dto");
const update_deal_dto_1 = require("../dto/update-deal.dto");
const list_deals_query_dto_1 = require("../dto/list-deals-query.dto");
let DealsController = class DealsController {
    dealsService;
    constructor(dealsService) {
        this.dealsService = dealsService;
    }
    listDeals(query) {
        return this.dealsService.listDeals(query);
    }
    createDeal(dto) {
        return this.dealsService.createDeal(dto);
    }
    getDeal(id) {
        return this.dealsService.getDeal(id);
    }
    updateDeal(id, dto) {
        return this.dealsService.updateDeal(id, dto);
    }
    deleteDeal(id) {
        return this.dealsService.deleteDeal(id);
    }
};
exports.DealsController = DealsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_deals_query_dto_1.ListDealsQueryDto]),
    __metadata("design:returntype", void 0)
], DealsController.prototype, "listDeals", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Deal'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_deal_dto_1.CreateDealDto]),
    __metadata("design:returntype", void 0)
], DealsController.prototype, "createDeal", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DealsController.prototype, "getDeal", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Deal'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_deal_dto_1.UpdateDealDto]),
    __metadata("design:returntype", void 0)
], DealsController.prototype, "updateDeal", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('crm', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Deal'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DealsController.prototype, "deleteDeal", null);
exports.DealsController = DealsController = __decorate([
    (0, common_1.Controller)('crm/deals'),
    __metadata("design:paramtypes", [deals_service_1.DealsService])
], DealsController);
//# sourceMappingURL=deals.controller.js.map