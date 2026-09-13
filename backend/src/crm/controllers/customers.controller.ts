import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ListCustomersQueryDto } from '../dto/list-customers-query.dto';

@Controller('crm/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission('crm', 'VIEW')
  listCustomers(@Query() query: ListCustomersQueryDto) {
    return this.customersService.listCustomers(query);
  }

  @Post()
  @RequirePermission('crm', 'CREATE')
  @AuditEntity('Customer')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customersService.createCustomer(dto);
  }

  @Get(':id')
  @RequirePermission('crm', 'VIEW')
  getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }

  @Patch(':id')
  @RequirePermission('crm', 'EDIT')
  @AuditEntity('Customer')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.updateCustomer(id, dto);
  }

  @Delete(':id')
  @RequirePermission('crm', 'DELETE')
  @AuditEntity('Customer')
  deleteCustomer(@Param('id') id: string) {
    return this.customersService.deleteCustomer(id);
  }
}
