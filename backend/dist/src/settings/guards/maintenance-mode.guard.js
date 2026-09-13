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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceModeGuard = void 0;
const common_1 = require("@nestjs/common");
const maintenance_mode_service_1 = require("../services/maintenance-mode.service");
const ALLOWED_DURING_MAINTENANCE_PREFIX = '/api/v1/settings/backups';
let MaintenanceModeGuard = class MaintenanceModeGuard {
    maintenanceModeService;
    constructor(maintenanceModeService) {
        this.maintenanceModeService = maintenanceModeService;
    }
    canActivate(context) {
        if (!this.maintenanceModeService.isActive())
            return true;
        const request = context.switchToHttp().getRequest();
        const path = (request.originalUrl ?? request.url ?? '').split('?')[0];
        if (path.startsWith(ALLOWED_DURING_MAINTENANCE_PREFIX))
            return true;
        throw new common_1.ServiceUnavailableException({
            code: 'MAINTENANCE_MODE',
            message: 'A database restore is in progress. Please try again shortly.',
        });
    }
};
exports.MaintenanceModeGuard = MaintenanceModeGuard;
exports.MaintenanceModeGuard = MaintenanceModeGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [maintenance_mode_service_1.MaintenanceModeService])
], MaintenanceModeGuard);
//# sourceMappingURL=maintenance-mode.guard.js.map