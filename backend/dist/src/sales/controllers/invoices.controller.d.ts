import { InvoicesService } from '../services/invoices.service';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { ListInvoicesQueryDto } from '../dto/list-invoices-query.dto';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    listInvoices(query: ListInvoicesQueryDto): Promise<{
        items: ({
            order: {
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
        } & {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            createdByUserId: string;
            customerId: string;
            orderId: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            issuedAt: Date;
        } & {
            totalAmount: number;
            amountPaid: number;
            outstandingBalance: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getInvoice(id: string): Promise<{
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
    updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<{
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
    voidInvoice(id: string): Promise<{
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
