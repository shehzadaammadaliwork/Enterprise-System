"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const bank_accounts_service_1 = require("./services/bank-accounts.service");
const transactions_service_1 = require("./services/transactions.service");
const reports_service_1 = require("./services/reports.service");
const bank_accounts_controller_1 = require("./controllers/bank-accounts.controller");
const transactions_controller_1 = require("./controllers/transactions.controller");
const reports_controller_1 = require("./controllers/reports.controller");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            bank_accounts_controller_1.BankAccountsController,
            transactions_controller_1.TransactionsController,
            reports_controller_1.ReportsController,
        ],
        providers: [bank_accounts_service_1.BankAccountsService, transactions_service_1.TransactionsService, reports_service_1.ReportsService],
        exports: [transactions_service_1.TransactionsService, bank_accounts_service_1.BankAccountsService, reports_service_1.ReportsService],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map