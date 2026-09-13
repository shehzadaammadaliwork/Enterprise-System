import type { PurchaseRequestStatus } from '../api/types';

/// Mirrors PurchaseRequestsService's rules. Purchased is deliberately not
/// offered here even from Approved — it needs actualAmount/bankAccountId
/// input, so it's a named "Mark as Purchased" action on the detail page
/// instead of a plain dropdown option (same reasoning as Sales' "Convert
/// to order"/"Generate invoice").
export function nextPurchaseRequestStatuses(current: PurchaseRequestStatus): PurchaseRequestStatus[] {
  if (current === 'PENDING') return ['APPROVED', 'REJECTED'];
  return [];
}
