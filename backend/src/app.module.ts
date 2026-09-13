import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './common/config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { QueueModule } from './common/queue/queue.module';
import { SecurityModule } from './common/security/security.module';
import { StorageModule } from './common/storage/storage.module';
import { EventsModule } from './common/websocket/events.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RbacModule } from './rbac/rbac.module';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { OrganizationModule } from './organization/organization.module';
import { EmployeesModule } from './employees/employees.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CrmModule } from './crm/crm.module';
import { SalesModule } from './sales/sales.module';
import { FinanceModule } from './finance/finance.module';
import { AssetsModule } from './assets/assets.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CalendarModule } from './calendar/calendar.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { MaintenanceModeGuard } from './settings/guards/maintenance-mode.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    QueueModule,
    SecurityModule,
    StorageModule,
    EventsModule,
    AuthModule,
    RbacModule,
    OrganizationModule,
    EmployeesModule,
    AuditLogsModule,
    CrmModule,
    SalesModule,
    FinanceModule,
    AssetsModule,
    PurchasingModule,
    DocumentsModule,
    NotificationsModule,
    CalendarModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: rate-limit, then maintenance-mode (blocks everything
    // except live-restore polling while a restore is running), then
    // authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: MaintenanceModeGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Every mutating request is captured before the response is reshaped,
    // though AuditLogInterceptor itself unwraps either shape defensively.
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
