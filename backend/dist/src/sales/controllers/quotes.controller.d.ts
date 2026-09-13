import { QuotesService } from '../services/quotes.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { ListQuotesQueryDto } from '../dto/list-quotes-query.dto';
export declare class QuotesController {
    private readonly quotesService;
    constructor(quotesService: QuotesService);
    listQuotes(query: ListQuotesQueryDto): Promise<{
        items: ({
            items: {
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                taxRatePercent: import("@prisma/client/runtime/library").Decimal;
                quoteId: string;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.QuoteStatus;
            createdByUserId: string;
            notes: string | null;
            customerId: string;
            dealId: string | null;
            validUntil: Date | null;
            convertedToOrderId: string | null;
        } & {
            items: ({
                quantity: import("@prisma/client/runtime/library").Decimal;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                taxRatePercent: import("@prisma/client/runtime/library").Decimal;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
            } & {
                quantity: number;
                unitPrice: number;
                taxRatePercent: number;
                lineTotal: number;
            })[];
            summary: {
                subtotal: number;
                taxTotal: number;
                total: number;
            };
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createQuote(user: AuthenticatedUser, dto: CreateQuoteDto): Promise<{
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            quoteId: string;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        createdByUserId: string;
        notes: string | null;
        customerId: string;
        dealId: string | null;
        validUntil: Date | null;
        convertedToOrderId: string | null;
    } & {
        items: ({
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        } & {
            quantity: number;
            unitPrice: number;
            taxRatePercent: number;
            lineTotal: number;
        })[];
        summary: {
            subtotal: number;
            taxTotal: number;
            total: number;
        };
    }>;
    getQuote(id: string): Promise<{
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            quoteId: string;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        createdByUserId: string;
        notes: string | null;
        customerId: string;
        dealId: string | null;
        validUntil: Date | null;
        convertedToOrderId: string | null;
    } & {
        items: ({
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        } & {
            quantity: number;
            unitPrice: number;
            taxRatePercent: number;
            lineTotal: number;
        })[];
        summary: {
            subtotal: number;
            taxTotal: number;
            total: number;
        };
    }>;
    updateQuote(id: string, dto: UpdateQuoteDto): Promise<{
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            quoteId: string;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        number: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        createdByUserId: string;
        notes: string | null;
        customerId: string;
        dealId: string | null;
        validUntil: Date | null;
        convertedToOrderId: string | null;
    } & {
        items: ({
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRatePercent: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        } & {
            quantity: number;
            unitPrice: number;
            taxRatePercent: number;
            lineTotal: number;
        })[];
        summary: {
            subtotal: number;
            taxTotal: number;
            total: number;
        };
    }>;
    deleteQuote(id: string): Promise<void>;
    convertQuote(id: string, user: AuthenticatedUser): Promise<{
        quote: {
            status: "CONVERTED";
            convertedToOrderId: string;
            items: {
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                taxRatePercent: import("@prisma/client/runtime/library").Decimal;
                quoteId: string;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
            }[];
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            notes: string | null;
            customerId: string;
            dealId: string | null;
            validUntil: Date | null;
        } & {
            items: ({
                quantity: import("@prisma/client/runtime/library").Decimal;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                taxRatePercent: import("@prisma/client/runtime/library").Decimal;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
            } & {
                quantity: number;
                unitPrice: number;
                taxRatePercent: number;
                lineTotal: number;
            })[];
            summary: {
                subtotal: number;
                taxTotal: number;
                total: number;
            };
        };
        order: {
            items: ({
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                taxRatePercent: import("@prisma/client/runtime/library").Decimal;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            } & {
                quantity: number;
                unitPrice: number;
                taxRatePercent: number;
                lineTotal: number;
            })[];
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdByUserId: string;
            customerId: string;
            dealId: string | null;
        };
    }>;
}
