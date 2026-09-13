import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGenerateInvoice, useOrder, useUpdateOrder } from '../api/hooks';
import { nextOrderStatuses } from '../lib/transitions';
import { useCustomer } from '../../crm/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatMoney } from '../lib/format';
import type { OrderStatus } from '../api/types';

const STATUS_BADGE_VARIANT: Record<OrderStatus, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  CONFIRMED: 'outline',
  FULFILLED: 'secondary',
  CANCELLED: 'destructive',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const { data: customer } = useCustomer(order?.customerId);
  const updateMutation = useUpdateOrder();
  const invoiceMutation = useGenerateInvoice();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !order) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleStatusChange(status: OrderStatus) {
    if (!id) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id, status },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update order.')) },
    );
  }

  function handleGenerateInvoice() {
    if (!id) return;
    setErrorMessage(null);
    invoiceMutation.mutate(id, {
      onSuccess: (invoice) => navigate(`/sales/invoices/${invoice.id}`),
      onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not generate invoice.')),
    });
  }

  return (
    <div>
      <Link to="/sales/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to orders
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Order O-{order.number}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {customer ? (
              <Link to={`/crm/customers/${customer.id}`} className="text-primary hover:underline">
                {customer.companyName}
              </Link>
            ) : (
              '—'
            )}
            <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{order.status}</Badge>
          </p>
        </div>
        <div className="flex items-end gap-3">
          {nextOrderStatuses(order.status).length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select value={order.status} onValueChange={(value) => handleStatusChange(value as OrderStatus)}>
                <SelectTrigger id="status" className="w-40">
                  <SelectValue>{order.status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={order.status}>{order.status}</SelectItem>
                  {nextOrderStatuses(order.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {order.invoice ? (
            <Button variant="outline" asChild>
              <Link to={`/sales/invoices/${order.invoice.id}`}>View invoice</Link>
            </Button>
          ) : (
            <Button onClick={handleGenerateInvoice} disabled={invoiceMutation.isPending || order.status === 'CANCELLED'}>
              {invoiceMutation.isPending ? 'Generating…' : 'Generate invoice'}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Subtotal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatMoney(order.summary.subtotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatMoney(order.summary.taxTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(order.summary.total)}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Line items</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{formatMoney(item.unitPrice)}</TableCell>
                <TableCell className="text-muted-foreground">{item.taxRatePercent}%</TableCell>
                <TableCell className="font-medium">{formatMoney(item.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
