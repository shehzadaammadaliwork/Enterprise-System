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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const settings_service_1 = require("../services/settings.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const update_settings_dto_1 = require("../dto/update-settings.dto");
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    getSettings() {
        return this.settingsService.getSettings();
    }
    updateSettings(dto, user) {
        return this.settingsService.updateSettings(dto, user.id);
    }
    uploadLogo(file, user) {
        if (!file)
            throw new common_1.BadRequestException('A logo file is required.');
        return this.settingsService.uploadLogo(file, user.id);
    }
    deleteLogo(user) {
        return this.settingsService.deleteLogo(user.id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)(),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('SystemSettings'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_settings_dto_1.UpdateSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('branding/logo'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('SystemSettings'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: MAX_LOGO_SIZE_BYTES } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Delete)('branding/logo'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('SystemSettings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "deleteLogo", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map