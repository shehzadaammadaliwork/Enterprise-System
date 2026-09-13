import { QuoteItemInputDto } from './quote-item-input.dto';
export declare class CreateQuoteDto {
    customerId: string;
    dealId?: string;
    items: QuoteItemInputDto[];
    validUntil?: string;
    notes?: string;
}
