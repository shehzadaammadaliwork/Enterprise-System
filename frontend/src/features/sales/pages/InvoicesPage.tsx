import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices } from '../api/hooks';
import { useCustomers } from '../../crm/api/hooks';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { formatMoney } from '../lib/format';
import type { InvoiceStatus } from '../api/types';

const STATUS_FILTERS: { label: string; value: InvoiceStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Partially paid', value: 'PARTIALLY_PAID' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Void', value: 'VOID' },
];

const STATUS_BADGE_VARIANT: Record<InvoiceStatus, 'secondary' | 'outline' | 'destructive'> = {
  UNPAID: 'outline',
  PARTIALLY_PAID: 'outline',
  PAID: 'secondary',
  VOID: 'destructive',
};

export function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | undefined>(undefined);
  const { data, isLoading } = useInvoices(undefined, status);
  const { data: customers } = useCustomers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invoices generated from orders, with payments tracked against them.</p>
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

      <p className="mb-4 text-sm text-muted-foreground">{data?.meta.total ?? 0} invoice(s)</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No invoices yet — generate one from an order.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((invoice) => {
                const customer = customers?.data.find((c) => c.id === invoice.customerId);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">INV-{invoice.number}</TableCell>
                    <TableCell className="text-muted-foreground">{customer?.companyName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>{invoice.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(invoice.totalAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(invoice.outstandingBalance)}</TableCell>
                    <TableCell>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link to={`/sales/invoices/${invoice.id}`}>View</Link>
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
