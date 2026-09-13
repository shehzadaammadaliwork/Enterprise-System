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
import { QuotesService } from '../services/quotes.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { ListQuotesQueryDto } from '../dto/list-quotes-query.dto';

@Controller('sales/quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @RequirePermission('sales', 'VIEW')
  listQuotes(@Query() query: ListQuotesQueryDto) {
    return this.quotesService.listQuotes(query);
  }

  @Post()
  @RequirePermission('sales', 'CREATE')
  @AuditEntity('Quote')
  createQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.createQuote(dto, user.id);
  }

  @Get(':id')
  @RequirePermission('sales', 'VIEW')
  getQuote(@Param('id') id: string) {
    return this.quotesService.getQuote(id);
  }

  @Patch(':id')
  @RequirePermission('sales', 'EDIT')
  @AuditEntity('Quote')
  updateQuote(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.updateQuote(id, dto);
  }

  @Delete(':id')
  @RequirePermission('sales', 'DELETE')
  @AuditEntity('Quote')
  deleteQuote(@Param('id') id: string) {
    return this.quotesService.deleteQuote(id);
  }

  @Post(':id/convert')
  @RequirePermission('sales', 'EDIT')
  @AuditEntity('Quote')
  convertQuote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.quotesService.convertQuote(id, user.id);
  }
}
