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
import { BankAccountsService } from '../services/bank-accounts.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { UpdateBankAccountDto } from '../dto/update-bank-account.dto';
import { ListBankAccountsQueryDto } from '../dto/list-bank-accounts-query.dto';

@Controller('finance/bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @RequirePermission('finance', 'VIEW')
  listAccounts(@Query() query: ListBankAccountsQueryDto) {
    return this.bankAccountsService.listAccounts(query);
  }

  @Post()
  @RequirePermission('finance', 'CREATE')
  @AuditEntity('BankAccount')
  createAccount(@Body() dto: CreateBankAccountDto) {
    return this.bankAccountsService.createAccount(dto);
  }

  @Get(':id')
  @RequirePermission('finance', 'VIEW')
  getAccount(@Param('id') id: string) {
    return this.bankAccountsService.getAccount(id);
  }

  @Patch(':id')
  @RequirePermission('finance', 'EDIT')
  @AuditEntity('BankAccount')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.bankAccountsService.updateAccount(id, dto);
  }

  @Delete(':id')
  @RequirePermission('finance', 'DELETE')
  @AuditEntity('BankAccount')
  deleteAccount(@Param('id') id: string) {
    return this.bankAccountsService.deleteAccount(id);
  }
}
