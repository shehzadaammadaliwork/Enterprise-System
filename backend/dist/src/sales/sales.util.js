"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLineTotal = computeLineTotal;
exports.summarizeItems = summarizeItems;
const client_1 = require("@prisma/client");
function computeLineTotal(quantity, unitPrice, taxRatePercent) {
    const base = new client_1.Prisma.Decimal(quantity).times(unitPrice);
    const taxMultiplier = new client_1.Prisma.Decimal(1).plus(new client_1.Prisma.Decimal(taxRatePercent).dividedBy(100));
    return base.times(taxMultiplier).toDecimalPlaces(2);
}
function summarizeItems(items) {
    const total = items.reduce((sum, item) => sum.plus(item.lineTotal), new client_1.Prisma.Decimal(0));
    const subtotal = items.reduce((sum, item) => sum.plus(new client_1.Prisma.Decimal(item.quantity).times(item.unitPrice)), new client_1.Prisma.Decimal(0));
    return {
        subtotal: Number(subtotal.toDecimalPlaces(2)),
        taxTotal: Number(total.minus(subtotal).toDecimalPlaces(2)),
        total: Number(total.toDecimalPlaces(2)),
    };
}
//# sourceMappingURL=sales.util.js.map