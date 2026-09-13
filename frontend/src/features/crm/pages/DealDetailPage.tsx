import { useState, type SubmitEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDeal, useUpdateDeal } from '../api/hooks';
import { useCreateQuote, useOrders, useProducts, useQuotes } from '../../sales/api/hooks';
import { QuoteLineItemsEditor } from '../../sales/components/QuoteLineItemsEditor';
import { nextDealStages } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { NotesSection } from '../components/NotesSection';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatMoney } from '../../sales/lib/format';
import type { QuoteItemInput } from '../../sales/api/sales.api';
import type { DealStage } from '../api/types';

const QUOTE_STATUS_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  SENT: 'outline',
  ACCEPTED: 'secondary',
  REJECTED: 'destructive',
  EXPIRED: 'destructive',
  CONVERTED: 'secondary',
};

const STAGE_BADGE_VARIANT: Record<DealStage, 'secondary' | 'outline' | 'destructive'> = {
  NEW: 'outline',
  QUALIFIED: 'outline',
  PROPOSAL: 'outline',
  NEGOTIATION: 'outline',
  WON: 'secondary',
  LOST: 'destructive',
};

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading } = useDeal(id);
  const updateMutation = useUpdateDeal();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: dealQuotes } = useQuotes(undefined, undefined, id);
  const { data: dealOrders } = useOrders(undefined, undefined, id);

  const { data: products } = useProducts();
  const createQuoteMutation = useCreateQuote();
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [newQuoteItems, setNewQuoteItems] = useState<QuoteItemInput[]>([]);
  const [newQuoteNotes, setNewQuoteNotes] = useState('');
  const [newQuoteValidUntil, setNewQuoteValidUntil] = useState('');
  const [createQuoteError, setCreateQuoteError] = useState<string | null>(null);

  if (isLoading || !deal) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleStageChange(stage: DealStage) {
    if (!id) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id, input: { stage } },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update deal stage.')) },
    );
  }

  function openCreateQuote() {
    setNewQuoteItems([]);
    setNewQuoteNotes('');
    setNewQuoteValidUntil('');
    setCreateQuoteError(null);
    setShowCreateQuote(true);
  }

  function handleCreateQuoteSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deal) return;
    setCreateQuoteError(null);
    createQuoteMutation.mutate(
      {
        customerId: deal.customerId,
        dealId: deal.id,
        items: newQuoteItems,
        notes: newQuoteNotes || undefined,
        validUntil: newQuoteValidUntil || undefined,
      },
      {
        onSuccess: () => setShowCreateQuote(false),
        onError: (e) => setCreateQuoteError(extractApiErrorMessage(e, 'Could not create quote.')),
      },
    );
  }

  // Quotes only ever get created while a deal is actively being priced —
  // not before (New/Qualified, nothing to quote yet) and not after
  // (Won/Lost, the negotiation is over).
  const canCreateQuote = deal.stage === 'PROPOSAL' || deal.stage === 'NEGOTIATION';

  // Next intermediate (non-terminal) stage, if any — WON and LOST get
  // their own named actions below rather than living in this dropdown.
  const nextStages = nextDealStages(deal.stage);
  const nextIntermediateStage = nextStages.find((stage) => stage !== 'WON' && stage !== 'LOST');
  const canMarkWon = nextStages.includes('WON');
  const canMarkLost = nextStages.includes('LOST');

  return (
    <div>
      <Link to="/crm/deals" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to deals
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{deal.title}</h1>
          {deal.customer && (
            <p className="mt-1 text-sm text-muted-foreground">
              <Link to={`/crm/customers/${deal.customer.id}`} className="text-primary hover:underline">
                {deal.customer.companyName}
              </Link>
            </p>
          )}
        </div>
        <div className="flex items-end gap-2">
          {nextIntermediateStage && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stage" className="text-xs text-muted-foreground">
                Stage
              </Label>
              <Select value={deal.stage} onValueChange={(value) => handleStageChange(value as DealStage)}>
                <SelectTrigger id="stage" className="w-40">
                  <SelectValue>{deal.stage}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={deal.stage}>{deal.stage}</SelectItem>
                  <SelectItem value={nextIntermediateStage}>{nextIntermediateStage}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {!nextIntermediateStage && !canMarkWon && !canMarkLost && (
            <Badge variant={STAGE_BADGE_VARIANT[deal.stage]}>{deal.stage}</Badge>
          )}
          {canMarkWon && (
            <Button onClick={() => handleStageChange('WON')} disabled={updateMutation.isPending}>
              Mark as Won
            </Button>
          )}
          {canMarkLost && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => handleStageChange('LOST')}
              disabled={updateMutation.isPending}
            >
              Mark as Lost
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(deal.value)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expected close</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Quotes &amp; orders</h2>
          {canCreateQuote && (
            <Button variant="outline" size="sm" onClick={openCreateQuote}>
              Create quote
            </Button>
          )}
        </div>
        {!dealQuotes?.data.length ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            No quotes linked to this deal yet.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealQuotes.data.map((quote) => {
                  const order = dealOrders?.data.find((o) => o.id === quote.convertedToOrderId);
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">Q-{quote.number}</TableCell>
                      <TableCell>
                        <Badge variant={QUOTE_STATUS_VARIANT[quote.status]}>{quote.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatMoney(quote.summary.total)}</TableCell>
                      <TableCell>
                        {order ? (
                          <Link to={`/sales/orders/${order.id}`} className="text-primary hover:underline">
                            O-{order.number}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {order?.invoice ? (
                          <Link to={`/sales/invoices/${order.invoice.id}`} className="text-primary hover:underline">
                            INV-{order.invoice.number}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="link" className="h-auto p-0" asChild>
                          <Link to={`/sales/quotes/${quote.id}`}>View</Link>
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

      <NotesSection target={{ dealId: deal.id }} />

      {showCreateQuote && (
        <Modal title="Create quote" onClose={() => setShowCreateQuote(false)}>
          {createQuoteError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{createQuoteError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleCreateQuoteSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <p className="text-sm text-muted-foreground">{deal.customer?.companyName ?? '—'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Related deal</Label>
              <p className="text-sm text-muted-foreground">{deal.title}</p>
            </div>

            <QuoteLineItemsEditor items={newQuoteItems} products={products?.data} onChange={setNewQuoteItems} />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newQuoteValidUntil">Valid until</Label>
                <Input
                  id="newQuoteValidUntil"
                  type="date"
                  value={newQuoteValidUntil}
                  onChange={(e) => setNewQuoteValidUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newQuoteNotes">Notes</Label>
              <Input id="newQuoteNotes" value={newQuoteNotes} onChange={(e) => setNewQuoteNotes(e.target.value)} />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createQuoteMutation.isPending || newQuoteItems.length === 0}
            >
              {createQuoteMutation.isPending ? 'Creating…' : 'Create quote'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
