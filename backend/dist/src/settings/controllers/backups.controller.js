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
exports.BackupsController = void 0;
const common_1 = require("@nestjs/common");
const backup_service_1 = require("../services/backup.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const run_backup_dto_1 = require("../dto/run-backup.dto");
const restore_backup_dto_1 = require("../dto/restore-backup.dto");
let BackupsController = class BackupsController {
    backupService;
    constructor(backupService) {
        this.backupService = backupService;
    }
    listBackups(query) {
        return this.backupService.listBackups(query);
    }
    runBackup(dto, user) {
        return this.backupService.enqueueBackup(dto.type ?? 'FULL', 'MANUAL', user.id);
    }
    downloadBackup(id) {
        return this.backupService.downloadBackup(id);
    }
    restoreBackup(id, dto, user) {
        return this.backupService.requestRestore(id, dto, user.id);
    }
    getRestore(id) {
        return this.backupService.getRestoreOrThrow(id);
    }
};
exports.BackupsController = BackupsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], BackupsController.prototype, "listBackups", null);
__decorate([
    (0, common_1.Post)('run'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('BackupRecord'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [run_backup_dto_1.RunBackupDto, Object]),
    __metadata("design:returntype", void 0)
], BackupsController.prototype, "runBackup", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BackupsController.prototype, "downloadBackup", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('RestoreRecord'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, restore_backup_dto_1.RestoreBackupDto, Object]),
    __metadata("design:returntype", void 0)
], BackupsController.prototype, "restoreBackup", null);
__decorate([
    (0, common_1.Get)('restores/:id'),
    (0, require_permission_decorator_1.RequirePermission)('settings', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BackupsController.prototype, "getRestore", null);
exports.BackupsController = BackupsController = __decorate([
    (0, common_1.Controller)('settings/backups'),
    __metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupsController);
//# sourceMappingURL=backups.controller.js.map