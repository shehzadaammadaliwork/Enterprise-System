import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDecideTransaction, useDeleteTransaction, useTransaction } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { formatDate, formatMoney } from '../lib/format';
import type { TransactionStatus } from '../api/types';

const STATUS_BADGE_VARIANT: Record<TransactionStatus, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
};

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id);
  const decideMutation = useDecideTransaction();
  const deleteMutation = useDeleteTransaction();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !transaction) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleDecide(approve: boolean) {
    if (!id) return;
    setErrorMessage(null);
    decideMutation.mutate(
      { id, approve },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update this expense.')) },
    );
  }

  function handleDelete() {
    if (!id || !confirm('Delete this transaction?')) return;
    deleteMutation.mutate(id, { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not delete transaction.')) });
  }

  const editable = transaction.type === 'INCOME' || transaction.status === 'PENDING';

  return (
    <div>
      <Link
        to="/finance/transactions"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Back to transactions
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{transaction.category}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {transaction.type} · {transaction.bankAccount?.name ?? '—'}
            <Badge variant={STATUS_BADGE_VARIANT[transaction.status]}>{transaction.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transaction.type === 'EXPENSE' && transaction.status === 'PENDING' && (
            <>
              <Button onClick={() => handleDecide(true)} disabled={decideMutation.isPending}>
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => handleDecide(false)}
                disabled={decideMutation.isPending}
              >
                Reject
              </Button>
            </>
          )}
          {editable && (
            <Button variant="outline" className="text-destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(transaction.amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(transaction.transactionDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{transaction.bankAccount?.name ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-foreground">Description</h2>
      <p className="text-sm text-muted-foreground">{transaction.description ?? '—'}</p>

      {transaction.decidedAt && (
        <p className="mt-6 text-xs text-muted-foreground">Decided {formatDate(transaction.decidedAt)}</p>
      )}
    </div>
  );
}
