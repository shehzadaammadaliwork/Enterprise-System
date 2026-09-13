import { Prisma } from '@prisma/client';

/// quantity * unitPrice * (1 + taxRatePercent / 100), computed with
/// decimal.js (via Prisma.Decimal) rather than floating point, matching
/// the precision the rest of this schema's Decimal(12,2) money fields need.
export function computeLineTotal(
  quantity: Prisma.Decimal.Value,
  unitPrice: Prisma.Decimal.Value,
  taxRatePercent: Prisma.Decimal.Value,
): Prisma.Decimal {
  const base = new Prisma.Decimal(quantity).times(unitPrice);
  const taxMultiplier = new Prisma.Decimal(1).plus(
    new Prisma.Decimal(taxRatePercent).dividedBy(100),
  );
  return base.times(taxMultiplier).toDecimalPlaces(2);
}

interface LineItemLike {
  quantity: Prisma.Decimal.Value;
  unitPrice: Prisma.Decimal.Value;
  taxRatePercent: Prisma.Decimal.Value;
  lineTotal: Prisma.Decimal.Value;
}

/// Sums a set of line items into { subtotal, taxTotal, total } as plain
/// JS numbers — used to shape the response for Quote/Order detail
/// endpoints, which don't store an aggregate total of their own (only
/// Invoice.totalAmount is stored, as a fixed billing snapshot).
export function summarizeItems(items: LineItemLike[]) {
  const total = items.reduce(
    (sum, item) => sum.plus(item.lineTotal),
    new Prisma.Decimal(0),
  );
  const subtotal = items.reduce(
    (sum, item) =>
      sum.plus(new Prisma.Decimal(item.quantity).times(item.unitPrice)),
    new Prisma.Decimal(0),
  );
  return {
    subtotal: Number(subtotal.toDecimalPlaces(2)),
    taxTotal: Number(total.minus(subtotal).toDecimalPlaces(2)),
    total: Number(total.toDecimalPlaces(2)),
  };
}
