import type { TransactionStatus } from '../api/types';

/// Mirrors TransactionsService.decide() — only a PENDING expense can be
/// approved/rejected; APPROVED/REJECTED are final from this dropdown
/// (same "no reopen" rule as LeaveRequest). INCOME never reaches this
/// dropdown at all since it has no workflow (always APPROVED already).
export function nextTransactionStatuses(current: TransactionStatus): TransactionStatus[] {
  if (current === 'PENDING') return ['APPROVED', 'REJECTED'];
  return [];
}
