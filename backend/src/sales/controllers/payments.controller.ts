import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListPaymentsQueryDto } from '../dto/list-payments-query.dto';

@Controller('sales/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission('sales', 'VIEW')
  listPayments(@Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.listPayments(query);
  }

  @Post()
  @RequirePermission('sales', 'CREATE')
  @AuditEntity('Payment')
  createPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(dto, user.id);
  }
}
