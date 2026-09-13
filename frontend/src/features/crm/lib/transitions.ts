import type { DealStage, LeadStatus } from '../api/types';

/// Mirrors LeadsService's LEAD_SEQUENCE/isValidLeadStatusTransition on the
/// backend — CONVERTED is deliberately excluded here since it's only
/// reachable via the dedicated "Convert to customer" action, never this
/// dropdown (Bug 1: a lead must be Qualified first).
const LEAD_SEQUENCE: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED'];

export function nextLeadStatuses(current: LeadStatus): LeadStatus[] {
  if (current === 'CONVERTED' || current === 'LOST') return [];
  const options: LeadStatus[] = [];
  const index = LEAD_SEQUENCE.indexOf(current);
  if (index !== -1 && index + 1 < LEAD_SEQUENCE.length) options.push(LEAD_SEQUENCE[index + 1]);
  options.push('LOST');
  return options;
}

/// Mirrors DealsService's DEAL_SEQUENCE/isValidDealStageTransition.
const DEAL_SEQUENCE: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];

export function nextDealStages(current: DealStage): DealStage[] {
  if (current === 'WON' || current === 'LOST') return [];
  const options: DealStage[] = [];
  const index = DEAL_SEQUENCE.indexOf(current);
  if (index !== -1 && index + 1 < DEAL_SEQUENCE.length) options.push(DEAL_SEQUENCE[index + 1]);
  options.push('LOST');
  return options;
}
