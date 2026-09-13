import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: ListProductsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.ProductWhereInput = {
      ...(query.type && { type: query.type }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)
      throw new AppException(
        'PRODUCT_NOT_FOUND',
        'Product not found.',
        HttpStatus.NOT_FOUND,
      );
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.getProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProduct(id);
    const [quoteItemCount, orderItemCount] = await Promise.all([
      this.prisma.quoteItem.count({ where: { productId: id } }),
      this.prisma.orderItem.count({ where: { productId: id } }),
    ]);
    if (quoteItemCount > 0 || orderItemCount > 0) {
      throw new AppException(
        'PRODUCT_IN_USE',
        'This product appears on an existing quote or order and cannot be deleted — deactivate it instead.',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.product.delete({ where: { id } });
  }
}
