"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const rbac_module_1 = require("../rbac/rbac.module");
const employees_module_1 = require("../employees/employees.module");
const crm_module_1 = require("../crm/crm.module");
const sales_module_1 = require("../sales/sales.module");
const finance_module_1 = require("../finance/finance.module");
const calendar_module_1 = require("../calendar/calendar.module");
const notifications_module_1 = require("../notifications/notifications.module");
const dashboard_service_1 = require("./services/dashboard.service");
const dashboard_controller_1 = require("./controllers/dashboard.controller");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            rbac_module_1.RbacModule,
            employees_module_1.EmployeesModule,
            crm_module_1.CrmModule,
            sales_module_1.SalesModule,
            finance_module_1.FinanceModule,
            calendar_module_1.CalendarModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map