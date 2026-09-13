import type { QuoteItemInput } from '../api/sales.api';
import type { LineItemSummary } from '../api/types';

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/// Client-side mirror of the backend's summarizeItems (sales.util.ts) —
/// plain JS number math (not Decimal-precise) is fine here since this only
/// ever drives a live preview while editing; the authoritative total always
/// comes back from the server on save. unitPrice/taxRatePercent are both
/// entered by the rep per line (the catalog carries no pricing), so no
/// product lookup is needed here.
export function computeLocalSummary(items: QuoteItemInput[]): LineItemSummary {
  let subtotal = 0;
  let total = 0;
  for (const item of items) {
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineTotal = lineSubtotal * (1 + item.taxRatePercent / 100);
    subtotal += lineSubtotal;
    total += lineTotal;
  }
  return {
    subtotal: round2(subtotal),
    taxTotal: round2(total - subtotal),
    total: round2(total),
  };
}
