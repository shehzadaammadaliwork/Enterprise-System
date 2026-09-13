import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PurchaseRequestsService } from '../services/purchase-requests.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreatePurchaseRequestDto } from '../dto/create-purchase-request.dto';
import { MarkPurchasedDto } from '../dto/mark-purchased.dto';
import { ListPurchaseRequestsQueryDto } from '../dto/list-purchase-requests-query.dto';

@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(
    private readonly purchaseRequestsService: PurchaseRequestsService,
  ) {}

  /// Any authenticated user can submit a request — same self-service
  /// precedent as LeaveController.createRequest, no permission required.
  @Post()
  @AuditEntity('PurchaseRequest')
  createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.purchaseRequestsService.createRequest(user.id, dto);
  }

  @Get('me')
  getMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.purchaseRequestsService.listMyRequests(user.id, query);
  }

  @Get()
  @RequirePermission('procurement', 'VIEW')
  listRequests(@Query() query: ListPurchaseRequestsQueryDto) {
    return this.purchaseRequestsService.listRequests(query);
  }

  @Get(':id')
  @RequirePermission('procurement', 'VIEW')
  getRequest(@Param('id') id: string) {
    return this.purchaseRequestsService.getRequest(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('procurement', 'EDIT')
  @AuditEntity('PurchaseRequest')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseRequestsService.decide(id, user.id, true);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('procurement', 'EDIT')
  @AuditEntity('PurchaseRequest')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseRequestsService.decide(id, user.id, false);
  }

  @Patch(':id/mark-purchased')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('procurement', 'EDIT')
  @AuditEntity('PurchaseRequest')
  markPurchased(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MarkPurchasedDto,
  ) {
    return this.purchaseRequestsService.markPurchased(id, user.id, dto);
  }
}
