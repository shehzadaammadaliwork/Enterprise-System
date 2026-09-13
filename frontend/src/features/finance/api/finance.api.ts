import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type {
  BankAccount,
  CashFlowReport,
  ProfitAndLossReport,
  Transaction,
  TransactionStatus,
  TransactionType,
} from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// -- Bank accounts ------------------------------------------------------

export async function fetchBankAccounts(search?: string, page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<BankAccount>>('/finance/bank-accounts', {
    params: { search, page, limit },
  });
  return res.data;
}

export async function fetchBankAccount(id: string) {
  const res = await apiClient.get<Envelope<BankAccount>>(`/finance/bank-accounts/${id}`);
  return res.data.data;
}

export interface BankAccountInput {
  name: string;
  bankName?: string;
  accountNumber?: string;
  openingBalance?: number;
}

export async function createBankAccount(input: BankAccountInput) {
  const res = await apiClient.post<Envelope<BankAccount>>('/finance/bank-accounts', input);
  return res.data.data;
}

export async function updateBankAccount(id: string, input: Partial<Omit<BankAccountInput, 'openingBalance'>> & { isActive?: boolean }) {
  const res = await apiClient.patch<Envelope<BankAccount>>(`/finance/bank-accounts/${id}`, input);
  return res.data.data;
}

export async function deleteBankAccount(id: string) {
  await apiClient.delete(`/finance/bank-accounts/${id}`);
}

// -- Transactions -----------------------------------------------------------

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  category?: string;
  bankAccountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchTransactions(filters: TransactionFilters = {}, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Transaction>>('/finance/transactions', {
    params: { ...filters, page, limit },
  });
  return res.data;
}

export async function fetchTransaction(id: string) {
  const res = await apiClient.get<Envelope<Transaction>>(`/finance/transactions/${id}`);
  return res.data.data;
}

export interface TransactionInput {
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  transactionDate: string;
  bankAccountId: string;
}

export async function createTransaction(input: TransactionInput) {
  const res = await apiClient.post<Envelope<Transaction>>('/finance/transactions', input);
  return res.data.data;
}

export async function updateTransaction(
  id: string,
  input: Partial<Omit<TransactionInput, 'type'>>,
) {
  const res = await apiClient.patch<Envelope<Transaction>>(`/finance/transactions/${id}`, input);
  return res.data.data;
}

export async function deleteTransaction(id: string) {
  await apiClient.delete(`/finance/transactions/${id}`);
}

export async function decideTransaction(id: string, approve: boolean) {
  const res = await apiClient.patch<Envelope<Transaction>>(`/finance/transactions/${id}/${approve ? 'approve' : 'reject'}`);
  return res.data.data;
}

// -- Reports --------------------------------------------------------------

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  bankAccountId?: string;
}

export async function fetchProfitAndLoss(filters: ReportFilters) {
  const res = await apiClient.get<Envelope<ProfitAndLossReport>>('/finance/reports/profit-loss', { params: filters });
  return res.data.data;
}

export async function fetchCashFlow(filters: ReportFilters) {
  const res = await apiClient.get<Envelope<CashFlowReport>>('/finance/reports/cash-flow', { params: filters });
  return res.data.data;
}
