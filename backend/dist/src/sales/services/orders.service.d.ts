import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toPublicShape;
    listOrders(query: ListOrdersQueryDto): Promise<{
        items: ({
            invoice: {
                number: number;
                id: string;
                status: import("@prisma/client").$Enums.InvoiceStatus;
            } | null;
            items: {
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                quantity: Prisma.Decimal;
                unitPrice: Prisma.Decimal;
                taxRatePercent: Prisma.Decimal;
                lineTotal: Prisma.Decimal;
                orderId: string;
            }[];
        } & {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdByUserId: string;
            customerId: string;
            dealId: string | null;
        } & {
            items: {
                quantity: number;
                unitPrice: number;
                taxRatePercent: number;
                lineTotal: number;
            }[];
            summary: {
                subtotal: number;
                taxTotal: number;
                total: number;
            };
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getOrder(id: string): Promise<{
        invoice: {
            number: number;
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
        } | null;
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            taxRatePercent: Prisma.Decimal;
            lineTotal: Prisma.Decimal;
            orderId: string;
        }[];
    } & {
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdByUserId: string;
        customerId: string;
        dealId: string | null;
    } & {
        items: {
            quantity: number;
            unitPrice: number;
            taxRatePercent: number;
            lineTotal: number;
        }[];
        summary: {
            subtotal: number;
            taxTotal: number;
            total: number;
        };
    }>;
    updateOrder(id: string, dto: UpdateOrderDto): Promise<{
        invoice: {
            number: number;
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
        } | null;
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            taxRatePercent: Prisma.Decimal;
            lineTotal: Prisma.Decimal;
            orderId: string;
        }[];
    } & {
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdByUserId: string;
        customerId: string;
        dealId: string | null;
    } & {
        items: {
            quantity: number;
            unitPrice: number;
            taxRatePercent: number;
            lineTotal: number;
        }[];
        summary: {
            subtotal: number;
            taxTotal: number;
            total: number;
        };
    }>;
}
