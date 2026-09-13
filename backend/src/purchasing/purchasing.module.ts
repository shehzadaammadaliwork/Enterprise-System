import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { FinanceModule } from '../finance/finance.module';
import { EmployeesModule } from '../employees/employees.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RbacModule } from '../rbac/rbac.module';
import { PurchaseRequestsService } from './services/purchase-requests.service';
import { PurchaseRequestsController } from './controllers/purchase-requests.controller';

@Module({
  imports: [
    AssetsModule,
    FinanceModule,
    EmployeesModule,
    NotificationsModule,
    RbacModule,
  ],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService],
})
export class PurchasingModule {}
