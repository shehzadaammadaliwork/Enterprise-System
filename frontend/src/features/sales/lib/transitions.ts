import type { OrderStatus, QuoteStatus } from '../api/types';

/// Mirrors QuotesService's isValidQuoteStatusTransition on the backend —
/// CONVERTED is deliberately excluded here since it's only reachable via
/// the dedicated "Convert to order" action, never this dropdown.
export function nextQuoteStatuses(current: QuoteStatus): QuoteStatus[] {
  if (current === 'DRAFT') return ['SENT'];
  if (current === 'SENT') return ['ACCEPTED', 'REJECTED', 'EXPIRED'];
  return [];
}

/// Mirrors QuotesService's CONVERTIBLE_QUOTE_STATUSES.
export function isQuoteConvertible(status: QuoteStatus): boolean {
  return status === 'SENT' || status === 'ACCEPTED';
}

/// Mirrors OrdersService's ORDER_SEQUENCE/isValidOrderStatusTransition —
/// PENDING -> CONFIRMED -> FULFILLED, with CANCELLED reachable from
/// PENDING or CONFIRMED but not from FULFILLED (both are terminal).
const ORDER_SEQUENCE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'FULFILLED'];

export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  if (current === 'CANCELLED' || current === 'FULFILLED') return [];
  const options: OrderStatus[] = [];
  const index = ORDER_SEQUENCE.indexOf(current);
  if (index !== -1 && index + 1 < ORDER_SEQUENCE.length) options.push(ORDER_SEQUENCE[index + 1]);
  options.push('CANCELLED');
  return options;
}
