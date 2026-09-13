import { ProductType } from '@prisma/client';
export declare class CreateProductDto {
    name: string;
    description?: string;
    type?: ProductType;
}
