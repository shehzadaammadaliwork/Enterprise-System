import { Prisma, type QuoteItem } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CustomersService } from '../../crm/services/customers.service';
import { DealsService } from '../../crm/services/deals.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { ListQuotesQueryDto } from '../dto/list-quotes-query.dto';
type QuoteItemDecimalShape = Pick<QuoteItem, 'quantity' | 'unitPrice' | 'taxRatePercent' | 'lineTotal'>;
export declare class QuotesService {
    private readonly prisma;
    private readonly customersService;
    private readonly dealsService;
    constructor(prisma: PrismaService, customersService: CustomersService, dealsService: DealsService);
    private requireDealMatchesCustomer;
    private itemToPublicShape;
    private toPublicShape;
    private buildItemsData;
    listQuotes(query: ListQuotesQueryDto): Promise<{
        items: ({
            items: {
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                quantity: Prisma.Decimal;
                unitPrice: Prisma.Decimal;
                taxRatePercent: Prisma.Decimal;
                quoteId: string;
                lineTotal: Prisma.Decimal;
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
            items: (QuoteItemDecimalShape & {
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
    getQuote(id: string): Promise<{
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            taxRatePercent: Prisma.Decimal;
            quoteId: string;
            lineTotal: Prisma.Decimal;
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
        items: (QuoteItemDecimalShape & {
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
    createQuote(dto: CreateQuoteDto, createdByUserId: string): Promise<{
        items: {
            id: string;
            description: string;
            createdAt: Date;
            productId: string;
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            taxRatePercent: Prisma.Decimal;
            quoteId: string;
            lineTotal: Prisma.Decimal;
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
        items: (QuoteItemDecimalShape & {
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
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            taxRatePercent: Prisma.Decimal;
            quoteId: string;
            lineTotal: Prisma.Decimal;
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
        items: (QuoteItemDecimalShape & {
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
    convertQuote(id: string, createdByUserId: string): Promise<{
        quote: {
            status: "CONVERTED";
            convertedToOrderId: string;
            items: {
                id: string;
                description: string;
                createdAt: Date;
                productId: string;
                quantity: Prisma.Decimal;
                unitPrice: Prisma.Decimal;
                taxRatePercent: Prisma.Decimal;
                quoteId: string;
                lineTotal: Prisma.Decimal;
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
            items: (QuoteItemDecimalShape & {
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
                quantity: Prisma.Decimal;
                unitPrice: Prisma.Decimal;
                taxRatePercent: Prisma.Decimal;
                lineTotal: Prisma.Decimal;
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
export {};
