import type { LeaveStatus } from '../api/types';

/// Mirrors LeaveService's decide() guard (only PENDING can be decided) —
/// APPROVED/REJECTED are final states from this dropdown; reopening one
/// would need a separate, deliberate action, not this quick control.
export function nextLeaveStatuses(current: LeaveStatus): LeaveStatus[] {
  if (current === 'PENDING') return ['APPROVED', 'REJECTED'];
  return [];
}
