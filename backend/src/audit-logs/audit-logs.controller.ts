import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission('audit-logs', 'VIEW')
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsService.listAuditLogs(query);
  }

  // Must be declared before `:id` so it isn't shadowed by the param route.
  @Get('modules')
  @RequirePermission('audit-logs', 'VIEW')
  listModules() {
    return this.auditLogsService.listDistinctModules();
  }

  @Get(':id')
  @RequirePermission('audit-logs', 'VIEW')
  get(@Param('id') id: string) {
    return this.auditLogsService.getAuditLog(id);
  }
}
