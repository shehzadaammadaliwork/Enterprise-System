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
import { DealsService } from '../services/deals.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';

@Controller('crm/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @RequirePermission('crm', 'VIEW')
  listDeals(@Query() query: ListDealsQueryDto) {
    return this.dealsService.listDeals(query);
  }

  @Post()
  @RequirePermission('crm', 'CREATE')
  @AuditEntity('Deal')
  createDeal(@Body() dto: CreateDealDto) {
    return this.dealsService.createDeal(dto);
  }

  @Get(':id')
  @RequirePermission('crm', 'VIEW')
  getDeal(@Param('id') id: string) {
    return this.dealsService.getDeal(id);
  }

  @Patch(':id')
  @RequirePermission('crm', 'EDIT')
  @AuditEntity('Deal')
  updateDeal(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.dealsService.updateDeal(id, dto);
  }

  @Delete(':id')
  @RequirePermission('crm', 'DELETE')
  @AuditEntity('Deal')
  deleteDeal(@Param('id') id: string) {
    return this.dealsService.deleteDeal(id);
  }
}
