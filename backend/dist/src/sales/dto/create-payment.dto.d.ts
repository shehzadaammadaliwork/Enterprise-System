import { PaymentMethod } from '@prisma/client';
export declare class CreatePaymentDto {
    invoiceId: string;
    amount: number;
    method?: PaymentMethod;
    reference?: string;
    paidAt?: string;
}
