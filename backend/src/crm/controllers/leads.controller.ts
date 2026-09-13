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
import { LeadsService } from '../services/leads.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';

@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermission('crm', 'VIEW')
  listLeads(@Query() query: ListLeadsQueryDto) {
    return this.leadsService.listLeads(query);
  }

  @Post()
  @RequirePermission('crm', 'CREATE')
  @AuditEntity('Lead')
  createLead(@Body() dto: CreateLeadDto) {
    return this.leadsService.createLead(dto);
  }

  @Get(':id')
  @RequirePermission('crm', 'VIEW')
  getLead(@Param('id') id: string) {
    return this.leadsService.getLead(id);
  }

  @Patch(':id')
  @RequirePermission('crm', 'EDIT')
  @AuditEntity('Lead')
  updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.updateLead(id, dto);
  }

  @Delete(':id')
  @RequirePermission('crm', 'DELETE')
  @AuditEntity('Lead')
  deleteLead(@Param('id') id: string) {
    return this.leadsService.deleteLead(id);
  }

  @Post(':id/convert')
  @RequirePermission('crm', 'EDIT')
  @AuditEntity('Lead')
  convertLead(@Param('id') id: string) {
    return this.leadsService.convertLead(id);
  }
}
