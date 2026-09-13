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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const documents_service_1 = require("../services/documents.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const upload_document_dto_1 = require("../dto/upload-document.dto");
const update_document_dto_1 = require("../dto/update-document.dto");
const set_document_access_dto_1 = require("../dto/set-document-access.dto");
const list_documents_query_dto_1 = require("../dto/list-documents-query.dto");
let DocumentsController = class DocumentsController {
    documentsService;
    constructor(documentsService) {
        this.documentsService = documentsService;
    }
    listForEntity(query, user) {
        return this.documentsService.listForEntity(query, user.id);
    }
    uploadDocument(dto, file, user) {
        if (!file)
            throw new common_1.BadRequestException('A file is required.');
        return this.documentsService.uploadDocument(dto, file, user.id);
    }
    getDocument(id, user) {
        return this.documentsService.getDocument(id, user.id);
    }
    updateDocument(id, dto) {
        return this.documentsService.updateDocument(id, dto);
    }
    setAccess(id, dto) {
        return this.documentsService.setAccess(id, dto);
    }
    deleteDocument(id) {
        return this.documentsService.deleteDocument(id);
    }
    addVersion(id, file, user) {
        if (!file)
            throw new common_1.BadRequestException('A file is required.');
        return this.documentsService.addVersion(id, file, user.id);
    }
    downloadLatest(id, user) {
        return this.documentsService.downloadVersion(id, undefined, user.id);
    }
    downloadVersion(id, versionId, user) {
        return this.documentsService.downloadVersion(id, versionId, user.id);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_documents_query_dto_1.ListDocumentsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "listForEntity", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: documents_service_1.MAX_DOCUMENT_SIZE_BYTES } })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upload_document_dto_1.UploadDocumentDto, Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Document'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_document_dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "updateDocument", null);
__decorate([
    (0, common_1.Patch)(':id/access'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Document'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_document_access_dto_1.SetDocumentAccessDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "setAccess", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Document'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: documents_service_1.MAX_DOCUMENT_SIZE_BYTES } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "addVersion", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "downloadLatest", null);
__decorate([
    (0, common_1.Get)(':id/versions/:versionId/download'),
    (0, require_permission_decorator_1.RequirePermission)('documents', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('versionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "downloadVersion", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map