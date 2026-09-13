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
import { AssetsService } from '../services/assets.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ChangeAssetStatusDto } from '../dto/change-asset-status.dto';
import { ListAssetsQueryDto } from '../dto/list-assets-query.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @RequirePermission('inventory', 'VIEW')
  listAssets(@Query() query: ListAssetsQueryDto) {
    return this.assetsService.listAssets(query);
  }

  @Post()
  @RequirePermission('inventory', 'CREATE')
  @AuditEntity('Asset')
  createAsset(@Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(dto);
  }

  @Get(':id')
  @RequirePermission('inventory', 'VIEW')
  getAsset(@Param('id') id: string) {
    return this.assetsService.getAsset(id);
  }

  @Patch(':id')
  @RequirePermission('inventory', 'EDIT')
  @AuditEntity('Asset')
  updateAsset(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.updateAsset(id, dto);
  }

  @Patch(':id/status')
  @RequirePermission('inventory', 'EDIT')
  @AuditEntity('Asset')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeAssetStatusDto) {
    return this.assetsService.changeStatus(id, dto);
  }

  @Delete(':id')
  @RequirePermission('inventory', 'DELETE')
  @AuditEntity('Asset')
  deleteAsset(@Param('id') id: string) {
    return this.assetsService.deleteAsset(id);
  }
}
