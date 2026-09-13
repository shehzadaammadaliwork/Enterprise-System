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
exports.BankAccountsController = void 0;
const common_1 = require("@nestjs/common");
const bank_accounts_service_1 = require("../services/bank-accounts.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const create_bank_account_dto_1 = require("../dto/create-bank-account.dto");
const update_bank_account_dto_1 = require("../dto/update-bank-account.dto");
const list_bank_accounts_query_dto_1 = require("../dto/list-bank-accounts-query.dto");
let BankAccountsController = class BankAccountsController {
    bankAccountsService;
    constructor(bankAccountsService) {
        this.bankAccountsService = bankAccountsService;
    }
    listAccounts(query) {
        return this.bankAccountsService.listAccounts(query);
    }
    createAccount(dto) {
        return this.bankAccountsService.createAccount(dto);
    }
    getAccount(id) {
        return this.bankAccountsService.getAccount(id);
    }
    updateAccount(id, dto) {
        return this.bankAccountsService.updateAccount(id, dto);
    }
    deleteAccount(id) {
        return this.bankAccountsService.deleteAccount(id);
    }
};
exports.BankAccountsController = BankAccountsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_bank_accounts_query_dto_1.ListBankAccountsQueryDto]),
    __metadata("design:returntype", void 0)
], BankAccountsController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('BankAccount'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bank_account_dto_1.CreateBankAccountDto]),
    __metadata("design:returntype", void 0)
], BankAccountsController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BankAccountsController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('BankAccount'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bank_account_dto_1.UpdateBankAccountDto]),
    __metadata("design:returntype", void 0)
], BankAccountsController.prototype, "updateAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'DELETE'),
    (0, audit_entity_decorator_1.AuditEntity)('BankAccount'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BankAccountsController.prototype, "deleteAccount", null);
exports.BankAccountsController = BankAccountsController = __decorate([
    (0, common_1.Controller)('finance/bank-accounts'),
    __metadata("design:paramtypes", [bank_accounts_service_1.BankAccountsService])
], BankAccountsController);
//# sourceMappingURL=bank-accounts.controller.js.map