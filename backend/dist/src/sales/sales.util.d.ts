import { Prisma } from '@prisma/client';
export declare function computeLineTotal(quantity: Prisma.Decimal.Value, unitPrice: Prisma.Decimal.Value, taxRatePercent: Prisma.Decimal.Value): Prisma.Decimal;
interface LineItemLike {
    quantity: Prisma.Decimal.Value;
    unitPrice: Prisma.Decimal.Value;
    taxRatePercent: Prisma.Decimal.Value;
    lineTotal: Prisma.Decimal.Value;
}
export declare function summarizeItems(items: LineItemLike[]): {
    subtotal: number;
    taxTotal: number;
    total: number;
};
export {};
