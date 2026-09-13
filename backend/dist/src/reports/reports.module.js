"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const crm_module_1 = require("../crm/crm.module");
const employees_module_1 = require("../employees/employees.module");
const sales_module_1 = require("../sales/sales.module");
const finance_module_1 = require("../finance/finance.module");
const reports_service_1 = require("./services/reports.service");
const report_export_service_1 = require("./services/report-export.service");
const reports_controller_1 = require("./controllers/reports.controller");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [crm_module_1.CrmModule, employees_module_1.EmployeesModule, sales_module_1.SalesModule, finance_module_1.FinanceModule],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService, report_export_service_1.ReportExportService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map