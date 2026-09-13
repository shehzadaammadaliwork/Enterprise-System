import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InvoicesService } from '../services/invoices.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { ListInvoicesQueryDto } from '../dto/list-invoices-query.dto';

@Controller('sales/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermission('sales', 'VIEW')
  listInvoices(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.listInvoices(query);
  }

  @Get(':id')
  @RequirePermission('sales', 'VIEW')
  getInvoice(@Param('id') id: string) {
    return this.invoicesService.getInvoice(id);
  }

  @Patch(':id')
  @RequirePermission('sales', 'EDIT')
  @AuditEntity('Invoice')
  updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.updateInvoice(id, dto);
  }

  @Post(':id/void')
  @RequirePermission('sales', 'EDIT')
  @AuditEntity('Invoice')
  voidInvoice(@Param('id') id: string) {
    return this.invoicesService.voidInvoice(id);
  }
}
