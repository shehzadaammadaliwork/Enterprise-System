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
exports.PurchaseRequestsController = void 0;
const common_1 = require("@nestjs/common");
const purchase_requests_service_1 = require("../services/purchase-requests.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const create_purchase_request_dto_1 = require("../dto/create-purchase-request.dto");
const mark_purchased_dto_1 = require("../dto/mark-purchased.dto");
const list_purchase_requests_query_dto_1 = require("../dto/list-purchase-requests-query.dto");
let PurchaseRequestsController = class PurchaseRequestsController {
    purchaseRequestsService;
    constructor(purchaseRequestsService) {
        this.purchaseRequestsService = purchaseRequestsService;
    }
    createRequest(user, dto) {
        return this.purchaseRequestsService.createRequest(user.id, dto);
    }
    getMyRequests(user, query) {
        return this.purchaseRequestsService.listMyRequests(user.id, query);
    }
    listRequests(query) {
        return this.purchaseRequestsService.listRequests(query);
    }
    getRequest(id) {
        return this.purchaseRequestsService.getRequest(id);
    }
    approve(id, user) {
        return this.purchaseRequestsService.decide(id, user.id, true);
    }
    reject(id, user) {
        return this.purchaseRequestsService.decide(id, user.id, false);
    }
    markPurchased(id, user, dto) {
        return this.purchaseRequestsService.markPurchased(id, user.id, dto);
    }
};
exports.PurchaseRequestsController = PurchaseRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, audit_entity_decorator_1.AuditEntity)('PurchaseRequest'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_purchase_request_dto_1.CreatePurchaseRequestDto]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('procurement', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_purchase_requests_query_dto_1.ListPurchaseRequestsQueryDto]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('procurement', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('procurement', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('PurchaseRequest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('procurement', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('PurchaseRequest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/mark-purchased'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, require_permission_decorator_1.RequirePermission)('procurement', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('PurchaseRequest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, mark_purchased_dto_1.MarkPurchasedDto]),
    __metadata("design:returntype", void 0)
], PurchaseRequestsController.prototype, "markPurchased", null);
exports.PurchaseRequestsController = PurchaseRequestsController = __decorate([
    (0, common_1.Controller)('purchase-requests'),
    __metadata("design:paramtypes", [purchase_requests_service_1.PurchaseRequestsService])
], PurchaseRequestsController);
//# sourceMappingURL=purchase-requests.controller.js.map