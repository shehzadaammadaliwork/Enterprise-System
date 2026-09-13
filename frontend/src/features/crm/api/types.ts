export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'EVENT' | 'ADVERTISEMENT' | 'OTHER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
export type DealStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type ActivityType = 'MEETING' | 'CALL';

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  assignedToUserId: string | null;
  convertedToCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customer?: { id: string; companyName: string; contactName: string };
  value: number | null;
  stage: DealStage;
  expectedCloseDate: string | null;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  customerId: string;
  type: ActivityType;
  subject: string;
  notes: string | null;
  occurredAt: string;
  loggedByUserId: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  body: string;
  leadId: string | null;
  customerId: string | null;
  dealId: string | null;
  createdByUserId: string | null;
  createdAt: string;
}
