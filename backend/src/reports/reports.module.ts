import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { EmployeesModule } from '../employees/employees.module';
import { SalesModule } from '../sales/sales.module';
import { FinanceModule } from '../finance/finance.module';
import { ReportsService } from './services/reports.service';
import { ReportExportService } from './services/report-export.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [CrmModule, EmployeesModule, SalesModule, FinanceModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportExportService],
})
export class ReportsModule {}
