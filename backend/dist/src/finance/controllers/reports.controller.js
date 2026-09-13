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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("../services/reports.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const finance_report_query_dto_1 = require("../dto/finance-report-query.dto");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    profitAndLoss(query) {
        return this.reportsService.profitAndLoss(query);
    }
    cashFlow(query) {
        return this.reportsService.cashFlow(query);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('profit-loss'),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_report_query_dto_1.FinanceReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "profitAndLoss", null);
__decorate([
    (0, common_1.Get)('cash-flow'),
    (0, require_permission_decorator_1.RequirePermission)('finance', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_report_query_dto_1.FinanceReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "cashFlow", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('finance/reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map