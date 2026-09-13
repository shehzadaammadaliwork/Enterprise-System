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
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const reports_service_1 = require("../services/reports.service");
const sales_performance_report_query_dto_1 = require("../dto/sales-performance-report-query.dto");
const export_sales_performance_report_query_dto_1 = require("../dto/export-sales-performance-report-query.dto");
const hr_report_query_dto_1 = require("../dto/hr-report-query.dto");
const export_hr_report_query_dto_1 = require("../dto/export-hr-report-query.dto");
const finance_overview_report_query_dto_1 = require("../dto/finance-overview-report-query.dto");
const export_finance_overview_report_query_dto_1 = require("../dto/export-finance-overview-report-query.dto");
const MIME_TYPES = {
    pdf: 'application/pdf',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const EXTENSIONS = { pdf: 'pdf', excel: 'xlsx' };
function toFile(buffer, name, format) {
    return new common_1.StreamableFile(buffer, {
        type: MIME_TYPES[format],
        disposition: `attachment; filename="${name}.${EXTENSIONS[format]}"`,
    });
}
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    salesPerformance(query) {
        return this.reportsService.salesPerformance(query);
    }
    async exportSalesPerformance(query) {
        const buffer = await this.reportsService.exportSalesPerformance(query, query.format);
        return toFile(buffer, 'sales-performance-report', query.format);
    }
    hrReport(query) {
        return this.reportsService.hrReport(query);
    }
    async exportHrReport(query) {
        const buffer = await this.reportsService.exportHrReport(query, query.format);
        return toFile(buffer, 'hr-report', query.format);
    }
    financeOverview(query) {
        return this.reportsService.financeOverview(query);
    }
    async exportFinanceOverview(query) {
        const buffer = await this.reportsService.exportFinanceOverview(query, query.format);
        return toFile(buffer, 'finance-report', query.format);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('sales-performance'),
    (0, require_permission_decorator_1.RequirePermission)('reports', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_performance_report_query_dto_1.SalesPerformanceReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "salesPerformance", null);
__decorate([
    (0, common_1.Get)('sales-performance/export'),
    (0, require_permission_decorator_1.RequirePermission)('reports', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_sales_performance_report_query_dto_1.ExportSalesPerformanceReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportSalesPerformance", null);
__decorate([
    (0, common_1.Get)('hr'),
    (0, require_permission_decorator_1.RequirePermission)('reports', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hr_report_query_dto_1.HrReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "hrReport", null);
__decorate([
    (0, common_1.Get)('hr/export'),
    (0, require_permission_decorator_1.RequirePermission)('reports', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_hr_report_query_dto_1.ExportHrReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportHrReport", null);
__decorate([
    (0, common_1.Get)('finance'),
    (0, require_permission_decorator_1.RequirePermission)('reports', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_overview_report_query_dto_1.FinanceOverviewReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "financeOverview", null);
__decorate([
    (0, common_1.Get)('finance/export'),
    (0, require_permission_decorator_1.RequirePermission)('reports', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_finance_overview_report_query_dto_1.ExportFinanceOverviewReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportFinanceOverview", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map