import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useUpdateOrder } from '../api/hooks';
import { nextOrderStatuses } from '../lib/transitions';
import { useCustomers } from '../../crm/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { formatMoney } from '../lib/format';
import type { OrderStatus } from '../api/types';

const STATUS_FILTERS: { label: string; value: OrderStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Fulfilled', value: 'FULFILLED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const { data, isLoading } = useOrders(undefined, status);
  const { data: customers } = useCustomers();
  const updateMutation = useUpdateOrder();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  function handleStatusChange(id: string, newStatus: OrderStatus) {
    setStatusErrorMessage(null);
    updateMutation.mutate(
      { id, status: newStatus },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update order status.')) },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Orders created by converting an accepted quote.</p>
      </div>

      <div className="mb-5 inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              status === filter.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{data?.meta.total ?? 0} order(s)</p>

      {statusErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusErrorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No orders yet — convert a quote to create one.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((order) => {
                const customer = customers?.data.find((c) => c.id === order.customerId);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">O-{order.number}</TableCell>
                    <TableCell className="text-muted-foreground">{customer?.companyName ?? '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        disabled={nextOrderStatuses(order.status).length === 0 || updateMutation.isPending}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue>{order.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={order.status}>{order.status}</SelectItem>
                          {nextOrderStatuses(order.status).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(order.summary.total)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.invoice ? `INV-${order.invoice.number}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link to={`/sales/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
