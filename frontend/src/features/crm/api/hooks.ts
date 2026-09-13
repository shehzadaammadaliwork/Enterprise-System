import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './crm.api';
import type { NoteTarget } from './crm.api';
import type { DealStage, LeadStatus } from './types';

const KEYS = {
  leads: ['crm', 'leads'] as const,
  lead: (id: string) => ['crm', 'leads', id] as const,
  customers: ['crm', 'customers'] as const,
  customer: (id: string) => ['crm', 'customers', id] as const,
  deals: ['crm', 'deals'] as const,
  deal: (id: string) => ['crm', 'deals', id] as const,
  activities: (customerId: string) => ['crm', 'activities', customerId] as const,
  notes: (target: NoteTarget) => ['crm', 'notes', target] as const,
};

// -- Leads ------------------------------------------------------------------

export function useLeads(status?: LeadStatus, search?: string) {
  return useQuery({ queryKey: [...KEYS.leads, status, search], queryFn: () => api.fetchLeads(status, search) });
}

export function useLead(id: string | undefined) {
  return useQuery({ queryKey: KEYS.lead(id ?? ''), queryFn: () => api.fetchLead(id!), enabled: !!id });
}

function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.leads });
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({ mutationFn: api.createLead, onSuccess: invalidate });
}

export function useUpdateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.LeadInput> & { status?: LeadStatus } }) =>
      api.updateLead(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({ mutationFn: api.deleteLead, onSuccess: invalidate });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.convertLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.leads });
      queryClient.invalidateQueries({ queryKey: KEYS.customers });
    },
  });
}

// -- Customers ----------------------------------------------------------------

export function useCustomers(search?: string) {
  return useQuery({ queryKey: [...KEYS.customers, search], queryFn: () => api.fetchCustomers(search) });
}

export function useCustomer(id: string | undefined) {
  return useQuery({ queryKey: KEYS.customer(id ?? ''), queryFn: () => api.fetchCustomer(id!), enabled: !!id });
}

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.customers });
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({ mutationFn: api.createCustomer, onSuccess: invalidate });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.CustomerInput> }) => api.updateCustomer(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({ mutationFn: api.deleteCustomer, onSuccess: invalidate });
}

// -- Deals ----------------------------------------------------------------

export function useDeals(customerId?: string, stage?: DealStage) {
  return useQuery({ queryKey: [...KEYS.deals, customerId, stage], queryFn: () => api.fetchDeals(customerId, stage) });
}

export function useDeal(id: string | undefined) {
  return useQuery({ queryKey: KEYS.deal(id ?? ''), queryFn: () => api.fetchDeal(id!), enabled: !!id });
}

function useInvalidateDeals() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.deals });
}

export function useCreateDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({ mutationFn: api.createDeal, onSuccess: invalidate });
}

export function useUpdateDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.DealInput> }) => api.updateDeal(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({ mutationFn: api.deleteDeal, onSuccess: invalidate });
}

// -- Activities ---------------------------------------------------------------

export function useActivities(customerId: string) {
  return useQuery({
    queryKey: KEYS.activities(customerId),
    queryFn: () => api.fetchActivities(customerId),
    enabled: !!customerId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createActivity,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: KEYS.activities(variables.customerId) }),
  });
}

// -- Notes ----------------------------------------------------------------

export function useNotes(target: NoteTarget) {
  return useQuery({ queryKey: KEYS.notes(target), queryFn: () => api.fetchNotes(target) });
}

export function useCreateNote(target: NoteTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.createNote(target, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.notes(target) }),
  });
}

export function useDeleteNote(target: NoteTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.notes(target) }),
  });
}
