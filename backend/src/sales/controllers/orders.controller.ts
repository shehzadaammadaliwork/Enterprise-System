import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { InvoicesService } from '../services/invoices.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto';

@Controller('sales/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get()
  @RequirePermission('sales', 'VIEW')
  listOrders(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.listOrders(query);
  }

  @Get(':id')
  @RequirePermission('sales', 'VIEW')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Patch(':id')
  @RequirePermission('sales', 'EDIT')
  @AuditEntity('Order')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, dto);
  }

  @Post(':id/invoice')
  @RequirePermission('sales', 'CREATE')
  @AuditEntity('Invoice')
  generateInvoice(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.generateFromOrder(id, user.id);
  }
}
