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
import { ProductsService } from '../services/products.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';

@Controller('sales/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission('sales', 'VIEW')
  listProducts(@Query() query: ListProductsQueryDto) {
    return this.productsService.listProducts(query);
  }

  @Post()
  @RequirePermission('sales', 'CREATE')
  @AuditEntity('Product')
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Get(':id')
  @RequirePermission('sales', 'VIEW')
  getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Patch(':id')
  @RequirePermission('sales', 'EDIT')
  @AuditEntity('Product')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @RequirePermission('sales', 'DELETE')
  @AuditEntity('Product')
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
