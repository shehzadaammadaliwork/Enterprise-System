"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const configuration_1 = __importDefault(require("./common/config/configuration"));
const prisma_module_1 = require("./common/prisma/prisma.module");
const queue_module_1 = require("./common/queue/queue.module");
const security_module_1 = require("./common/security/security.module");
const storage_module_1 = require("./common/storage/storage.module");
const events_module_1 = require("./common/websocket/events.module");
const audit_log_interceptor_1 = require("./common/interceptors/audit-log.interceptor");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const csrf_middleware_1 = require("./common/middleware/csrf.middleware");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const rbac_module_1 = require("./rbac/rbac.module");
const permissions_guard_1 = require("./rbac/guards/permissions.guard");
const organization_module_1 = require("./organization/organization.module");
const employees_module_1 = require("./employees/employees.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const crm_module_1 = require("./crm/crm.module");
const sales_module_1 = require("./sales/sales.module");
const finance_module_1 = require("./finance/finance.module");
const assets_module_1 = require("./assets/assets.module");
const purchasing_module_1 = require("./purchasing/purchasing.module");
const documents_module_1 = require("./documents/documents.module");
const notifications_module_1 = require("./notifications/notifications.module");
const calendar_module_1 = require("./calendar/calendar.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const reports_module_1 = require("./reports/reports.module");
const settings_module_1 = require("./settings/settings.module");
const maintenance_mode_guard_1 = require("./settings/guards/maintenance-mode.guard");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(csrf_middleware_1.CsrfMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            throttler_1.ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
            prisma_module_1.PrismaModule,
            queue_module_1.QueueModule,
            security_module_1.SecurityModule,
            storage_module_1.StorageModule,
            events_module_1.EventsModule,
            auth_module_1.AuthModule,
            rbac_module_1.RbacModule,
            organization_module_1.OrganizationModule,
            employees_module_1.EmployeesModule,
            audit_logs_module_1.AuditLogsModule,
            crm_module_1.CrmModule,
            sales_module_1.SalesModule,
            finance_module_1.FinanceModule,
            assets_module_1.AssetsModule,
            purchasing_module_1.PurchasingModule,
            documents_module_1.DocumentsModule,
            notifications_module_1.NotificationsModule,
            calendar_module_1.CalendarModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: maintenance_mode_guard_1.MaintenanceModeGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_log_interceptor_1.AuditLogInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: response_interceptor_1.ResponseInterceptor },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map