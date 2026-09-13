import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { ListInvoicesQueryDto } from '../dto/list-invoices-query.dto';
export declare class InvoicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toPublicShape;
    listInvoices(query: ListInvoicesQueryDto): Promise<{
        items: ({
            order: {
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
            };
            payments: {
                id: string;
                createdAt: Date;
                method: import("@prisma/client").$Enums.PaymentMethod;
                invoiceId: string;
                amount: Prisma.Decimal;
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
            totalAmount: Prisma.Decimal;
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
            amount: Prisma.Decimal;
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
        totalAmount: Prisma.Decimal & number;
        dueDate: Date | null;
        issuedAt: Date;
        amountPaid: number;
        outstandingBalance: number;
    }>;
    generateFromOrder(orderId: string, createdByUserId: string): Promise<{
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
            amount: Prisma.Decimal;
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
        totalAmount: Prisma.Decimal & number;
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
            amount: Prisma.Decimal;
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
        totalAmount: Prisma.Decimal & number;
        dueDate: Date | null;
        issuedAt: Date;
        amountPaid: number;
        outstandingBalance: number;
    }>;
    private requireNotVoid;
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
            amount: Prisma.Decimal;
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
        totalAmount: Prisma.Decimal & number;
        dueDate: Date | null;
        issuedAt: Date;
        amountPaid: number;
        outstandingBalance: number;
    }>;
    recomputeStatus(tx: Prisma.TransactionClient, invoiceId: string): Promise<void>;
    getOutstandingSummary(): Promise<{
        outstandingInvoicesCount: number;
        outstandingInvoicesTotal: number;
    }>;
}
