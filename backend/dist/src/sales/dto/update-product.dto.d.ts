import { ProductType } from '@prisma/client';
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    type?: ProductType;
    isActive?: boolean;
}
