import { PaymentsService } from '../services/payments.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListPaymentsQueryDto } from '../dto/list-payments-query.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    listPayments(query: ListPaymentsQueryDto): Promise<{
        items: ({
            id: string;
            createdAt: Date;
            method: import("@prisma/client").$Enums.PaymentMethod;
            invoiceId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            reference: string | null;
            paidAt: Date;
            recordedByUserId: string;
        } & {
            amount: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createPayment(user: AuthenticatedUser, dto: CreatePaymentDto): Promise<{
        id: string;
        createdAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
        invoiceId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        reference: string | null;
        paidAt: Date;
        recordedByUserId: string;
    } & {
        amount: number;
    }>;
}
