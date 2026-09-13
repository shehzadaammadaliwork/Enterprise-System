import { QuoteStatus } from '@prisma/client';
import { QuoteItemInputDto } from './quote-item-input.dto';
export declare class UpdateQuoteDto {
    dealId?: string | null;
    items?: QuoteItemInputDto[];
    validUntil?: string;
    notes?: string;
    status?: QuoteStatus;
}
