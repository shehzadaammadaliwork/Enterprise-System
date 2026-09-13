import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listProducts(query: ListProductsQueryDto): Promise<{
        items: {
            id: string;
            description: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            type: import("@prisma/client").$Enums.ProductType;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getProduct(id: string): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: import("@prisma/client").$Enums.ProductType;
    }>;
    createProduct(dto: CreateProductDto): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: import("@prisma/client").$Enums.ProductType;
    }>;
    updateProduct(id: string, dto: UpdateProductDto): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: import("@prisma/client").$Enums.ProductType;
    }>;
    deleteProduct(id: string): Promise<void>;
}
