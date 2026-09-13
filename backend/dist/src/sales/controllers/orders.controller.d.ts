import { OrdersService } from '../services/orders.service';
import { InvoicesService } from '../services/invoices.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto';
export declare class OrdersController {
    private readonly ordersService;
    private readonly invoicesService;
    constructor(ordersService: OrdersService, invoicesService: InvoicesService);
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
                quantity: import("@prisma/client/runtime/library").Decimal;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                taxRatePercent: import("@prisma/client/runtime/library").Decimal;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
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
    generateInvoice(id: string, user: AuthenticatedUser): Promise<{
        order: {
            items: {
                quantity: number;
                unitPrice: number;
                taxRatePercent: number;
                lineTotal: number;
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                orderId: string;
            }[];
            summary: {
                subtotal: number;
                taxTotal: number;
                total: number;
            };
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdByUserId: string;
            customerId: string;
            dealId: string | null;
        };
        payments: {
            id: string;
            createdAt: Date;
            method: import("@prisma/client").$Enums.PaymentMethod;
            invoiceId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            reference: string | null;
            paidAt: Date;
            recordedByUserId: string;
        }[];
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        createdByUserId: string;
        customerId: string;
        orderId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal & number;
        dueDate: Date | null;
        issuedAt: Date;
        amountPaid: number;
        outstandingBalance: number;
    }>;
}
