import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { Activity, ActivityType, Customer, Deal, DealStage, Lead, LeadSource, LeadStatus, Note } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// -- Leads ----------------------------------------------------------------

export async function fetchLeads(status?: LeadStatus, search?: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Lead>>('/crm/leads', { params: { status, search, page, limit } });
  return res.data;
}

export async function fetchLead(id: string) {
  const res = await apiClient.get<Envelope<Lead>>(`/crm/leads/${id}`);
  return res.data.data;
}

export interface LeadInput {
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  assignedToUserId?: string;
}

export async function createLead(input: LeadInput) {
  const res = await apiClient.post<Envelope<Lead>>('/crm/leads', input);
  return res.data.data;
}

export async function updateLead(id: string, input: Partial<LeadInput> & { status?: LeadStatus }) {
  const res = await apiClient.patch<Envelope<Lead>>(`/crm/leads/${id}`, input);
  return res.data.data;
}

export async function deleteLead(id: string) {
  await apiClient.delete(`/crm/leads/${id}`);
}

export async function convertLead(id: string) {
  const res = await apiClient.post<Envelope<{ lead: Lead; customer: Customer }>>(`/crm/leads/${id}/convert`);
  return res.data.data;
}

// -- Customers --------------------------------------------------------------

export async function fetchCustomers(search?: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Customer>>('/crm/customers', { params: { search, page, limit } });
  return res.data;
}

export async function fetchCustomer(id: string) {
  const res = await apiClient.get<Envelope<Customer>>(`/crm/customers/${id}`);
  return res.data.data;
}

export interface CustomerInput {
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
}

export async function createCustomer(input: CustomerInput) {
  const res = await apiClient.post<Envelope<Customer>>('/crm/customers', input);
  return res.data.data;
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>) {
  const res = await apiClient.patch<Envelope<Customer>>(`/crm/customers/${id}`, input);
  return res.data.data;
}

export async function deleteCustomer(id: string) {
  await apiClient.delete(`/crm/customers/${id}`);
}

// -- Deals ------------------------------------------------------------------

export async function fetchDeals(customerId?: string, stage?: DealStage, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Deal>>('/crm/deals', { params: { customerId, stage, page, limit } });
  return res.data;
}

export async function fetchDeal(id: string) {
  const res = await apiClient.get<Envelope<Deal>>(`/crm/deals/${id}`);
  return res.data.data;
}

export interface DealInput {
  title: string;
  customerId: string;
  value?: number;
  stage?: DealStage;
  expectedCloseDate?: string;
  assignedToUserId?: string;
}

export async function createDeal(input: DealInput) {
  const res = await apiClient.post<Envelope<Deal>>('/crm/deals', input);
  return res.data.data;
}

export async function updateDeal(id: string, input: Partial<DealInput>) {
  const res = await apiClient.patch<Envelope<Deal>>(`/crm/deals/${id}`, input);
  return res.data.data;
}

export async function deleteDeal(id: string) {
  await apiClient.delete(`/crm/deals/${id}`);
}

// -- Activities (meetings/calls, logged against a customer) -----------------

export async function fetchActivities(customerId: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Activity>>('/crm/activities', { params: { customerId, page, limit } });
  return res.data;
}

export interface ActivityInput {
  customerId: string;
  type: ActivityType;
  subject: string;
  notes?: string;
  occurredAt: string;
}

export async function createActivity(input: ActivityInput) {
  const res = await apiClient.post<Envelope<Activity>>('/crm/activities', input);
  return res.data.data;
}

// -- Notes (attach to exactly one of lead/customer/deal) ---------------------

export type NoteTarget = { leadId: string } | { customerId: string } | { dealId: string };

export async function fetchNotes(target: NoteTarget, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Note>>('/crm/notes', { params: { ...target, page, limit } });
  return res.data;
}

export async function createNote(target: NoteTarget, body: string) {
  const res = await apiClient.post<Envelope<Note>>('/crm/notes', { ...target, body });
  return res.data.data;
}

export async function deleteNote(id: string) {
  await apiClient.delete(`/crm/notes/${id}`);
}
