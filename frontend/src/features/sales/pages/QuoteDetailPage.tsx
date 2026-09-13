import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useConvertQuote, useProducts, useQuote, useUpdateQuote } from '../api/hooks';
import { isQuoteConvertible } from '../lib/transitions';
import { computeLocalSummary } from '../lib/pricing';
import { QuoteLineItemsEditor } from '../components/QuoteLineItemsEditor';
import { useCustomer, useDeal } from '../../crm/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatMoney } from '../lib/format';
import type { QuoteItemInput } from '../api/sales.api';
import type { QuoteStatus } from '../api/types';

const STATUS_BADGE_VARIANT: Record<QuoteStatus, 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  SENT: 'outline',
  ACCEPTED: 'secondary',
  REJECTED: 'destructive',
  EXPIRED: 'destructive',
  CONVERTED: 'secondary',
};

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading } = useQuote(id);
  const { data: customer } = useCustomer(quote?.customerId);
  const { data: deal } = useDeal(quote?.dealId ?? undefined);
  const { data: products } = useProducts();
  const convertMutation = useConvertQuote();
  const updateMutation = useUpdateQuote();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<QuoteItemInput[]>([]);

  // Re-syncs whenever the fetched quote changes — including right after a
  // successful line-item save, when the refetched quote should become the
  // new editing baseline. Editing itself never triggers a refetch (no
  // network call happens until Save), so this can't clobber in-progress edits.
  useEffect(() => {
    if (!quote) return;
    setEditedItems(
      quote.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRatePercent: item.taxRatePercent,
      })),
    );
  }, [quote]);

  if (isLoading || !quote) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleConvert() {
    if (!id || !confirm(`Convert quote Q-${quote!.number} to an order?`)) return;
    setErrorMessage(null);
    convertMutation.mutate(id, {
      onSuccess: (result) => navigate(`/sales/orders/${result.order.id}`),
      onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not convert quote.')),
    });
  }

  function handleStatusChange(status: QuoteStatus) {
    if (!id) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id, input: { status } },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update quote status.')) },
    );
  }

  function handleSaveItems() {
    if (!id) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id, input: { items: editedItems } },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not save line items.')) },
    );
  }

  const convertible = isQuoteConvertible(quote.status);
  const isDraft = quote.status === 'DRAFT';
  // While Draft, the top summary cards reflect the live (possibly unsaved)
  // edit state — editedItems mirrors quote.items exactly until the user
  // changes something, so this is never out of sync on first render.
  const displaySummary = isDraft ? computeLocalSummary(editedItems) : quote.summary;

  return (
    <div>
      <Link to="/sales/quotes" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to quotes
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Quote Q-{quote.number}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {customer ? (
              <Link to={`/crm/customers/${customer.id}`} className="text-primary hover:underline">
                {customer.companyName}
              </Link>
            ) : (
              '—'
            )}
            <Badge variant={STATUS_BADGE_VARIANT[quote.status]}>{quote.status}</Badge>
            {quote.dealId && (
              <>
                &middot;
                {deal ? (
                  <Link to={`/crm/deals/${deal.id}`} className="text-primary hover:underline">
                    Deal: {deal.title}
                  </Link>
                ) : (
                  'Deal linked'
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quote.status === 'DRAFT' && (
            <Button onClick={() => handleStatusChange('SENT')} disabled={updateMutation.isPending}>
              Send Quote
            </Button>
          )}
          {quote.status === 'SENT' && (
            <>
              <Button onClick={() => handleStatusChange('ACCEPTED')} disabled={updateMutation.isPending}>
                Accept Quote
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => handleStatusChange('REJECTED')}
                disabled={updateMutation.isPending}
              >
                Reject Quote
              </Button>
            </>
          )}
          {quote.status === 'CONVERTED' ? (
            <Button variant="outline" asChild>
              <Link to={`/sales/orders/${quote.convertedToOrderId}`}>View order</Link>
            </Button>
          ) : (
            <span title={convertible ? undefined : 'Send the quote before converting it to an order.'}>
              <Button onClick={handleConvert} disabled={!convertible || convertMutation.isPending}>
                {convertMutation.isPending ? 'Converting…' : 'Convert to order'}
              </Button>
            </span>
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
            <div className="text-lg font-semibold">{formatMoney(displaySummary.subtotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatMoney(displaySummary.taxTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(displaySummary.total)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Line items</h2>
        {isDraft && (
          <Button size="sm" onClick={handleSaveItems} disabled={updateMutation.isPending || editedItems.length === 0}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </div>

      {isDraft ? (
        // Only a Draft quote is freely editable — once Sent, the customer
        // already has a copy of it, so a price/quantity change goes
        // through Reject + a new quote, not a silent edit (also enforced
        // server-side, not just hidden here).
        <QuoteLineItemsEditor items={editedItems} products={products?.data} onChange={setEditedItems} embedded />
      ) : (
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
              {quote.items.map((item) => (
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
      )}

      {quote.notes && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Notes</h2>
          <p className="text-sm text-muted-foreground">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
