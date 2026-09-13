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
exports.AssetsController = void 0;
const common_1 = require("@nestjs/common");
const assets_service_1 = require("../services/assets.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const create_asset_dto_1 = require("../dto/create-asset.dto");
const update_asset_dto_1 = require("../dto/update-asset.dto");
const change_asset_status_dto_1 = require("../dto/change-asset-status.dto");
const list_assets_query_dto_1 = require("../dto/list-assets-query.dto");
let AssetsController = class AssetsController {
    assetsService;
    constructor(assetsService) {
        this.assetsService = assetsService;
    }
    listAssets(query) {
        return this.assetsService.listAssets(query);
    }
    createAsset(dto) {
        return this.assetsService.createAsset(dto);
    }
    getAsset(id) {
        return this.assetsService.getAsset(id);
    }
    updateAsset(id, dto) {
        return this.assetsService.updateAsset(id, dto);
    }
    changeStatus(id, dto) {
        return this.assetsService.changeStatus(id, dto);
    }
    deleteAsset(id) {
        return this.assetsService.deleteAsset(id);
    }
};
exports.AssetsController = AssetsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('inventory', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_assets_query_dto_1.ListAssetsQueryDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "listAssets", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('inventory', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Asset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_asset_dto_1.CreateAssetDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "createAsset", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('inventory', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "getAsset", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('inventory', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Asset'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_asset_dto_1.UpdateAssetDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "updateAsset", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permission_decorator_1.RequirePermission)('inventory', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Asset'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_asset_status_dto_1.ChangeAssetStatusDto]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('inventory', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Asset'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "deleteAsset", null);
exports.AssetsController = AssetsController = __decorate([
    (0, common_1.Controller)('assets'),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetsController);
//# sourceMappingURL=assets.controller.js.map