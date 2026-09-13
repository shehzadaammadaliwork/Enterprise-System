import { useState, type SubmitEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreatePayment, useInvoice, useVoidInvoice } from '../api/hooks';
import { useCustomer } from '../../crm/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatMoney } from '../lib/format';
import type { InvoiceStatus, PaymentMethod } from '../api/types';

const STATUS_BADGE_VARIANT: Record<InvoiceStatus, 'secondary' | 'outline' | 'destructive'> = {
  UNPAID: 'outline',
  PARTIALLY_PAID: 'outline',
  PAID: 'secondary',
  VOID: 'destructive',
};

const METHODS: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER'];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: customer } = useCustomer(invoice?.customerId);
  const createPaymentMutation = useCreatePayment();
  const voidMutation = useVoidInvoice();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !invoice) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const canPay = invoice.status === 'UNPAID' || invoice.status === 'PARTIALLY_PAID';

  function handleRecordPayment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    createPaymentMutation.mutate(
      { invoiceId: id, amount: Number(amount), method, reference: reference || undefined },
      {
        onSuccess: () => {
          setShowPaymentForm(false);
          setAmount('');
          setReference('');
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not record payment.')),
      },
    );
  }

  function handleVoid() {
    if (!id || !confirm(`Void invoice INV-${invoice!.number}? This cannot be undone.`)) return;
    setErrorMessage(null);
    voidMutation.mutate(id, { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not void invoice.')) });
  }

  return (
    <div>
      <Link to="/sales/invoices" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to invoices
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoice INV-{invoice.number}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {customer ? (
              <Link to={`/crm/customers/${customer.id}`} className="text-primary hover:underline">
                {customer.companyName}
              </Link>
            ) : (
              '—'
            )}
            <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>{invoice.status.replace('_', ' ')}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canPay && (
            <Button onClick={() => setShowPaymentForm((v) => !v)}>{showPaymentForm ? 'Cancel' : 'Record payment'}</Button>
          )}
          {invoice.status !== 'VOID' && (
            <Button variant="outline" className="text-destructive" onClick={handleVoid} disabled={voidMutation.isPending}>
              {voidMutation.isPending ? 'Voiding…' : 'Void'}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(invoice.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatMoney(invoice.amountPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatMoney(invoice.outstandingBalance)}</div>
          </CardContent>
        </Card>
      </div>

      {showPaymentForm && (
        <Card className="mb-6">
          <CardContent>
            <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    max={invoice.outstandingBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="method">Method</Label>
                  <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                    <SelectTrigger id="method" className="w-full">
                      <SelectValue>{method}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction/cheque number" />
              </div>
              <Button type="submit" size="sm" className="w-fit" disabled={createPaymentMutation.isPending}>
                {createPaymentMutation.isPending ? 'Saving…' : 'Save payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 text-lg font-semibold text-foreground">Order items</h2>
      <div className="mb-8 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{formatMoney(item.unitPrice)}</TableCell>
                <TableCell className="font-medium">{formatMoney(item.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Payments</h2>
      {invoice.payments.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No payments recorded yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.method}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.reference ?? '—'}</TableCell>
                  <TableCell className="font-medium">{formatMoney(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
