import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ListCustomersQueryDto } from '../dto/list-customers-query.dto';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listCustomers(query: ListCustomersQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            addressLine1: string | null;
            city: string | null;
            country: string | null;
            phone: string | null;
            companyName: string;
            contactName: string;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getCustomer(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        addressLine1: string | null;
        city: string | null;
        country: string | null;
        phone: string | null;
        companyName: string;
        contactName: string;
    }>;
    createCustomer(dto: CreateCustomerDto): Prisma.Prisma__CustomerClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        addressLine1: string | null;
        city: string | null;
        country: string | null;
        phone: string | null;
        companyName: string;
        contactName: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateCustomer(id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        addressLine1: string | null;
        city: string | null;
        country: string | null;
        phone: string | null;
        companyName: string;
        contactName: string;
    }>;
    deleteCustomer(id: string): Promise<void>;
}
