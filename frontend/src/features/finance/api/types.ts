export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BankAccount {
  id: string;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  openingBalance: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  transactionDate: string;
  bankAccountId: string;
  bankAccount?: { id: string; name: string };
  status: TransactionStatus;
  createdByUserId: string;
  decidedByUserId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfitAndLossReport {
  dateFrom: string;
  dateTo: string;
  income: number;
  expenses: number;
  netProfit: number;
  byCategory: { type: TransactionType; category: string; total: number }[];
}

export interface CashFlowReport {
  dateFrom: string;
  dateTo: string;
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  closingBalance: number;
}
