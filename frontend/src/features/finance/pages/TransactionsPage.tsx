import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  useBankAccounts,
  useCreateTransaction,
  useDecideTransaction,
  useDeleteTransaction,
  useTransactions,
} from '../api/hooks';
import { nextTransactionStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { formatDate, formatMoney } from '../lib/format';
import type { TransactionInput } from '../api/finance.api';
import type { TransactionStatus, TransactionType } from '../api/types';

const TYPE_FILTERS: { label: string; value: TransactionType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
];

const STATUS_BADGE_VARIANT: Record<TransactionStatus, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
};

const INCOME_CATEGORIES = ['Sales Revenue', 'Service Revenue', 'Interest Income', 'Other Income'];
const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Software & Subscriptions',
  'Payroll',
  'Rent & Utilities',
  'Marketing',
  'Travel',
  'Professional Services',
  'Other',
];

const EMPTY_FORM: TransactionInput = {
  type: 'EXPENSE',
  category: '',
  amount: 0,
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  bankAccountId: '',
};

export function TransactionsPage() {
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const [status, setStatus] = useState<TransactionStatus | undefined>(undefined);
  const [bankAccountId, setBankAccountId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useTransactions({
    type,
    status,
    bankAccountId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: accounts } = useBankAccounts();
  const createMutation = useCreateTransaction();
  const decideMutation = useDecideTransaction();
  const deleteMutation = useDeleteTransaction();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TransactionInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate() {
    setForm({ ...EMPTY_FORM, bankAccountId: accounts?.data[0]?.id ?? '' });
    setErrorMessage(null);
    setShowForm(true);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(
      { ...form, transactionDate: new Date(form.transactionDate).toISOString() },
      {
        onSuccess: () => setShowForm(false),
        onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create transaction.')),
      },
    );
  }

  function handleStatusChange(id: string, newStatus: TransactionStatus) {
    setStatusErrorMessage(null);
    decideMutation.mutate(
      { id, approve: newStatus === 'APPROVED' },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update transaction status.')) },
    );
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    deleteMutation.mutate(id, { onError: (e) => alert(extractApiErrorMessage(e, 'Could not delete transaction.')) });
  }

  const categoryOptions = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Income and expenses by category, posted against a bank account.</p>
      </div>

      <div className="mb-5 inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setType(filter.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              type === filter.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filterStatus">Status</Label>
          <Select
            value={status ?? '__all__'}
            onValueChange={(value) => setStatus(value === '__all__' ? undefined : (value as TransactionStatus))}
          >
            <SelectTrigger id="filterStatus" className="w-full">
              <SelectValue>{status ?? 'All'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="APPROVED">APPROVED</SelectItem>
              <SelectItem value="REJECTED">REJECTED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filterAccount">Account</Label>
          <Select
            value={bankAccountId ?? '__all__'}
            onValueChange={(value) => setBankAccountId(value === '__all__' ? undefined : value)}
          >
            <SelectTrigger id="filterAccount" className="w-full">
              <SelectValue>{accounts?.data.find((a) => a.id === bankAccountId)?.name ?? 'All accounts'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All accounts</SelectItem>
              {(accounts?.data ?? []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateFrom">From</Label>
          <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateTo">To</Label>
          <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} transaction(s)</p>
        <Button type="button" size="sm" onClick={openCreate} disabled={!accounts?.data.length}>
          Add transaction
        </Button>
      </div>

      {statusErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusErrorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No transactions match these filters.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((transaction) => {
                const editable =
                  transaction.type === 'INCOME' || transaction.status === 'PENDING';
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">{formatDate(transaction.transactionDate)}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'INCOME' ? 'secondary' : 'outline'}>{transaction.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{transaction.category}</TableCell>
                    <TableCell className="text-muted-foreground">{transaction.bankAccount?.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(transaction.amount)}</TableCell>
                    <TableCell>
                      <Select
                        value={transaction.status}
                        disabled={nextTransactionStatuses(transaction.status).length === 0 || decideMutation.isPending}
                        onValueChange={(value) => handleStatusChange(transaction.id, value as TransactionStatus)}
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue>
                            <Badge variant={STATUS_BADGE_VARIANT[transaction.status]}>{transaction.status}</Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={transaction.status}>{transaction.status}</SelectItem>
                          {nextTransactionStatuses(transaction.status).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="flex items-center justify-end gap-3">
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link to={`/finance/transactions/${transaction.id}`}>View</Link>
                      </Button>
                      {editable && (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title="Add transaction" onClose={() => setShowForm(false)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value as TransactionType, category: '' })}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue>{form.type}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">INCOME</SelectItem>
                    <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                required
                list="categorySuggestions"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="categorySuggestions">
                {categoryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bankAccountId">Bank account</Label>
              <Select value={form.bankAccountId} onValueChange={(value) => setForm({ ...form, bankAccountId: value })}>
                <SelectTrigger id="bankAccountId" className="w-full">
                  <SelectValue placeholder="Select an account">
                    {accounts?.data.find((a) => a.id === form.bankAccountId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(accounts?.data ?? []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transactionDate">Date</Label>
              <Input
                id="transactionDate"
                type="date"
                required
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {form.type === 'EXPENSE' && (
              <p className="text-xs text-muted-foreground">
                This expense will be recorded as Pending until approved and won't count toward the account balance or reports
                until then.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.bankAccountId}>
              {createMutation.isPending ? 'Creating…' : 'Create transaction'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
