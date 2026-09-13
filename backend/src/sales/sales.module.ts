import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { ProductsService } from './services/products.service';
import { QuotesService } from './services/quotes.service';
import { OrdersService } from './services/orders.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { ProductsController } from './controllers/products.controller';
import { QuotesController } from './controllers/quotes.controller';
import { OrdersController } from './controllers/orders.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';

@Module({
  imports: [CrmModule],
  controllers: [
    ProductsController,
    QuotesController,
    OrdersController,
    InvoicesController,
    PaymentsController,
  ],
  providers: [
    ProductsService,
    QuotesService,
    OrdersService,
    InvoicesService,
    PaymentsService,
  ],
  exports: [InvoicesService, PaymentsService],
})
export class SalesModule {}
