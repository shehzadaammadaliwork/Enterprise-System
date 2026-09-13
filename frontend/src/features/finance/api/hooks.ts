import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './finance.api';
import type { TransactionFilters } from './finance.api';

const KEYS = {
  bankAccounts: ['finance', 'bank-accounts'] as const,
  bankAccount: (id: string) => ['finance', 'bank-accounts', id] as const,
  transactions: ['finance', 'transactions'] as const,
  transaction: (id: string) => ['finance', 'transactions', id] as const,
  profitAndLoss: ['finance', 'reports', 'profit-loss'] as const,
  cashFlow: ['finance', 'reports', 'cash-flow'] as const,
};

// -- Bank accounts ------------------------------------------------------

export function useBankAccounts(search?: string) {
  return useQuery({ queryKey: [...KEYS.bankAccounts, search], queryFn: () => api.fetchBankAccounts(search) });
}

export function useBankAccount(id: string | undefined) {
  return useQuery({ queryKey: KEYS.bankAccount(id ?? ''), queryFn: () => api.fetchBankAccount(id!), enabled: !!id });
}

function useInvalidateBankAccounts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.bankAccounts });
}

export function useCreateBankAccount() {
  const invalidate = useInvalidateBankAccounts();
  return useMutation({ mutationFn: api.createBankAccount, onSuccess: invalidate });
}

export function useUpdateBankAccount() {
  const invalidate = useInvalidateBankAccounts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateBankAccount>[1] }) =>
      api.updateBankAccount(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteBankAccount() {
  const invalidate = useInvalidateBankAccounts();
  return useMutation({ mutationFn: api.deleteBankAccount, onSuccess: invalidate });
}

// -- Transactions -----------------------------------------------------------

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...KEYS.transactions, filters],
    queryFn: () => api.fetchTransactions(filters),
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({ queryKey: KEYS.transaction(id ?? ''), queryFn: () => api.fetchTransaction(id!), enabled: !!id });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: KEYS.transactions });
    queryClient.invalidateQueries({ queryKey: KEYS.bankAccounts });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({ mutationFn: api.createTransaction, onSuccess: invalidate });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateTransaction>[1] }) =>
      api.updateTransaction(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({ mutationFn: api.deleteTransaction, onSuccess: invalidate });
}

export function useDecideTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.decideTransaction(id, approve),
    onSuccess: invalidate,
  });
}

// -- Reports --------------------------------------------------------------

export function useProfitAndLoss(filters: api.ReportFilters | undefined) {
  return useQuery({
    queryKey: [...KEYS.profitAndLoss, filters],
    queryFn: () => api.fetchProfitAndLoss(filters!),
    enabled: !!filters,
  });
}

export function useCashFlow(filters: api.ReportFilters | undefined) {
  return useQuery({
    queryKey: [...KEYS.cashFlow, filters],
    queryFn: () => api.fetchCashFlow(filters!),
    enabled: !!filters,
  });
}
