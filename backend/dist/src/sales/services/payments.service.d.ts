import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListPaymentsQueryDto } from '../dto/list-payments-query.dto';
import { InvoicesService } from './invoices.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly invoicesService;
    constructor(prisma: PrismaService, invoicesService: InvoicesService);
    private toPublicShape;
    listPayments(query: ListPaymentsQueryDto): Promise<{
        items: ({
            id: string;
            createdAt: Date;
            method: import("@prisma/client").$Enums.PaymentMethod;
            invoiceId: string;
            amount: Prisma.Decimal;
            reference: string | null;
            paidAt: Date;
            recordedByUserId: string;
        } & {
            amount: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createPayment(dto: CreatePaymentDto, recordedByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
        invoiceId: string;
        amount: Prisma.Decimal;
        reference: string | null;
        paidAt: Date;
        recordedByUserId: string;
    } & {
        amount: number;
    }>;
    getRevenueThisMonth(): Promise<{
        revenueThisMonth: number;
    }>;
}
