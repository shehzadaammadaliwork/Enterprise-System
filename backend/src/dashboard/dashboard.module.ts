import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { EmployeesModule } from '../employees/employees.module';
import { CrmModule } from '../crm/crm.module';
import { SalesModule } from '../sales/sales.module';
import { FinanceModule } from '../finance/finance.module';
import { CalendarModule } from '../calendar/calendar.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    RbacModule,
    EmployeesModule,
    CrmModule,
    SalesModule,
    FinanceModule,
    CalendarModule,
    NotificationsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
