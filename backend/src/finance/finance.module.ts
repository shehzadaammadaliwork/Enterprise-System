import { Module } from '@nestjs/common';
import { BankAccountsService } from './services/bank-accounts.service';
import { TransactionsService } from './services/transactions.service';
import { ReportsService } from './services/reports.service';
import { BankAccountsController } from './controllers/bank-accounts.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { ReportsController } from './controllers/reports.controller';

@Module({
  controllers: [
    BankAccountsController,
    TransactionsController,
    ReportsController,
  ],
  providers: [BankAccountsService, TransactionsService, ReportsService],
  exports: [TransactionsService, BankAccountsService, ReportsService],
})
export class FinanceModule {}
