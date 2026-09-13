"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasingModule = void 0;
const common_1 = require("@nestjs/common");
const assets_module_1 = require("../assets/assets.module");
const finance_module_1 = require("../finance/finance.module");
const employees_module_1 = require("../employees/employees.module");
const notifications_module_1 = require("../notifications/notifications.module");
const rbac_module_1 = require("../rbac/rbac.module");
const purchase_requests_service_1 = require("./services/purchase-requests.service");
const purchase_requests_controller_1 = require("./controllers/purchase-requests.controller");
let PurchasingModule = class PurchasingModule {
};
exports.PurchasingModule = PurchasingModule;
exports.PurchasingModule = PurchasingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            assets_module_1.AssetsModule,
            finance_module_1.FinanceModule,
            employees_module_1.EmployeesModule,
            notifications_module_1.NotificationsModule,
            rbac_module_1.RbacModule,
        ],
        controllers: [purchase_requests_controller_1.PurchaseRequestsController],
        providers: [purchase_requests_service_1.PurchaseRequestsService],
    })
], PurchasingModule);
//# sourceMappingURL=purchasing.module.js.map