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
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const api_keys_service_1 = require("../services/api-keys.service");
const api_key_guard_1 = require("../guards/api-key.guard");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const create_api_key_dto_1 = require("../dto/create-api-key.dto");
let ApiKeysController = class ApiKeysController {
    apiKeysService;
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    listKeys() {
        return this.apiKeysService.listKeys();
    }
    createKey(dto, user) {
        return this.apiKeysService.createKey(dto, user.id);
    }
    revokeKey(id) {
        return this.apiKeysService.revokeKey(id);
    }
    ping(request) {
        return { ok: true, keyLabel: request.apiKey?.label };
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "listKeys", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('ApiKey'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_api_key_dto_1.CreateApiKeyDto, Object]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "createKey", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('ApiKey'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "revokeKey", null);
__decorate([
    (0, common_1.Get)('ping'),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "ping", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, common_1.Controller)('settings/api-keys'),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map