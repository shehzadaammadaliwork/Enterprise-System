import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ListCustomersQueryDto } from '../dto/list-customers-query.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
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
    createCustomer(dto: CreateCustomerDto): import("@prisma/client").Prisma.Prisma__CustomerClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
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
