import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ListCustomersQueryDto } from '../dto/list-customers-query.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(query: ListCustomersQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.CustomerWhereInput = {
      ...(query.search && {
        OR: [
          { companyName: { contains: query.search, mode: 'insensitive' } },
          { contactName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer)
      throw new AppException(
        'CUSTOMER_NOT_FOUND',
        'Customer not found.',
        HttpStatus.NOT_FOUND,
      );
    return customer;
  }

  createCustomer(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    await this.getCustomer(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.getCustomer(id);
    await this.prisma.customer.delete({ where: { id } });
  }
}
