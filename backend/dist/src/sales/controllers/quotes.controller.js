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
exports.QuotesController = void 0;
const common_1 = require("@nestjs/common");
const quotes_service_1 = require("../services/quotes.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const create_quote_dto_1 = require("../dto/create-quote.dto");
const update_quote_dto_1 = require("../dto/update-quote.dto");
const list_quotes_query_dto_1 = require("../dto/list-quotes-query.dto");
let QuotesController = class QuotesController {
    quotesService;
    constructor(quotesService) {
        this.quotesService = quotesService;
    }
    listQuotes(query) {
        return this.quotesService.listQuotes(query);
    }
    createQuote(user, dto) {
        return this.quotesService.createQuote(dto, user.id);
    }
    getQuote(id) {
        return this.quotesService.getQuote(id);
    }
    updateQuote(id, dto) {
        return this.quotesService.updateQuote(id, dto);
    }
    deleteQuote(id) {
        return this.quotesService.deleteQuote(id);
    }
    convertQuote(id, user) {
        return this.quotesService.convertQuote(id, user.id);
    }
};
exports.QuotesController = QuotesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_quotes_query_dto_1.ListQuotesQueryDto]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "listQuotes", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Quote'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_quote_dto_1.CreateQuoteDto]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "createQuote", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "getQuote", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Quote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_quote_dto_1.UpdateQuoteDto]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "updateQuote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('Quote'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "deleteQuote", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Quote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "convertQuote", null);
exports.QuotesController = QuotesController = __decorate([
    (0, common_1.Controller)('sales/quotes'),
    __metadata("design:paramtypes", [quotes_service_1.QuotesService])
], QuotesController);
//# sourceMappingURL=quotes.controller.js.map