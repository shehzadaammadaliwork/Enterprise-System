import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { FinanceReportQueryDto } from '../dto/finance-report-query.dto';

@Controller('finance/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  @RequirePermission('finance', 'VIEW')
  profitAndLoss(@Query() query: FinanceReportQueryDto) {
    return this.reportsService.profitAndLoss(query);
  }

  @Get('cash-flow')
  @RequirePermission('finance', 'VIEW')
  cashFlow(@Query() query: FinanceReportQueryDto) {
    return this.reportsService.cashFlow(query);
  }
}
