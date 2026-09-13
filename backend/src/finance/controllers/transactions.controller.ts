import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { ListTransactionsQueryDto } from '../dto/list-transactions-query.dto';

@Controller('finance/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequirePermission('finance', 'VIEW')
  listTransactions(@Query() query: ListTransactionsQueryDto) {
    return this.transactionsService.listTransactions(query);
  }

  @Post()
  @RequirePermission('finance', 'CREATE')
  @AuditEntity('Transaction')
  createTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(dto, user.id);
  }

  @Get(':id')
  @RequirePermission('finance', 'VIEW')
  getTransaction(@Param('id') id: string) {
    return this.transactionsService.getTransaction(id);
  }

  @Patch(':id')
  @RequirePermission('finance', 'EDIT')
  @AuditEntity('Transaction')
  updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(id, dto);
  }

  @Delete(':id')
  @RequirePermission('finance', 'DELETE')
  @AuditEntity('Transaction')
  deleteTransaction(@Param('id') id: string) {
    return this.transactionsService.deleteTransaction(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('finance', 'EDIT')
  @AuditEntity('Transaction')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.decide(id, user.id, true);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('finance', 'EDIT')
  @AuditEntity('Transaction')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.decide(id, user.id, false);
  }
}
