import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDecidePurchaseRequest, useMarkPurchased, usePurchaseRequest } from '../api/hooks';
import { useBankAccounts } from '../../finance/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { PurchaseRequestStatus } from '../api/types';

const STATUS_BADGE_VARIANT: Record<PurchaseRequestStatus, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  PURCHASED: 'secondary',
  REJECTED: 'destructive',
};

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: request, isLoading } = usePurchaseRequest(id);
  const { data: accounts } = useBankAccounts();
  const decideMutation = useDecidePurchaseRequest();
  const markPurchasedMutation = useMarkPurchased();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [actualAmount, setActualAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  if (isLoading || !request) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleDecide(approve: boolean) {
    if (!id) return;
    setErrorMessage(null);
    decideMutation.mutate(
      { id, approve },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update this request.')) },
    );
  }

  function openPurchaseForm() {
    setActualAmount(String(request!.estimatedCost));
    setBankAccountId('');
    setErrorMessage(null);
    setShowPurchaseForm(true);
  }

  function handleMarkPurchased() {
    if (!id || !bankAccountId || !actualAmount) return;
    setErrorMessage(null);
    markPurchasedMutation.mutate(
      { id, input: { actualAmount: Number(actualAmount), bankAccountId } },
      {
        onSuccess: () => setShowPurchaseForm(false),
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not mark this request as purchased.')),
      },
    );
  }

  return (
    <div>
      <Link to="/purchase-requests" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to purchase requests
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            #{request.number} · {request.description}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {request.category}
            <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{request.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {request.status === 'PENDING' && (
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
          {request.status === 'APPROVED' && <Button onClick={openPurchaseForm}>Mark as Purchased</Button>}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(request.estimatedCost)}</div>
          </CardContent>
        </Card>
        {request.actualAmount !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actual amount paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(request.actualAmount)}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(request.purchasedAt)}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-foreground">Reason</h2>
      <p className="mb-6 text-sm text-muted-foreground">{request.reason}</p>

      {request.status === 'PURCHASED' && (
        <div className="flex flex-wrap gap-4">
          {request.linkedExpenseId && (
            <Link
              to={`/finance/transactions/${request.linkedExpenseId}`}
              className="text-sm text-primary hover:underline"
            >
              View linked Expense →
            </Link>
          )}
          {request.linkedAssetId && (
            <Link to={`/assets/${request.linkedAssetId}`} className="text-sm text-primary hover:underline">
              View created Asset →
            </Link>
          )}
        </div>
      )}

      {showPurchaseForm && (
        <Modal title="Mark as Purchased" onClose={() => setShowPurchaseForm(false)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="actual-amount">Actual amount paid</Label>
              <Input
                id="actual-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank-account">Paid from</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger id="bank-account" className="w-full">
                  <SelectValue placeholder="Select a bank account">
                    {accounts?.data.find((a) => a.id === bankAccountId)?.name}
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
            <p className="text-xs text-muted-foreground">
              This creates a Finance expense for the actual amount entered
              {request.category === 'EQUIPMENT' ? ', and an Asset record.' : '.'}
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={handleMarkPurchased}
              disabled={!bankAccountId || !actualAmount || markPurchasedMutation.isPending}
            >
              {markPurchasedMutation.isPending ? 'Saving…' : 'Confirm purchase'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
