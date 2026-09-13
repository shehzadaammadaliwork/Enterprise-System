import { Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { computeLocalSummary } from '../lib/pricing';
import { formatMoney } from '../lib/format';
import type { QuoteItemInput } from '../api/sales.api';
import type { Product } from '../api/types';

interface QuoteLineItemsEditorProps {
  items: QuoteItemInput[];
  products: Product[] | undefined;
  onChange: (items: QuoteItemInput[]) => void;
  /// Set false when the caller already renders its own "Line items"
  /// heading and subtotal/tax/total summary driven by the same live items
  /// (e.g. QuoteDetailPage's own <h2> + card row) — avoids a redundant
  /// second heading/total shown right below them.
  embedded?: boolean;
}

/// Shared line-item builder — product/quantity/unit-price/tax per row, live
/// recalculation — used everywhere a quote's line items are entered or
/// edited: the Deal-page "Create quote" flow and a Draft quote's detail-page
/// editing. The catalog carries no pricing at all, so unit price and tax
/// never pre-fill from the selected product — the rep enters both by hand
/// for every line, every time.
export function QuoteLineItemsEditor({ items, products, onChange, embedded = false }: QuoteLineItemsEditorProps) {
  const summary = computeLocalSummary(items);

  function addLine() {
    const firstProduct = products?.[0];
    if (!firstProduct) return;
    onChange([...items, { productId: firstProduct.id, quantity: 1, unitPrice: 0, taxRatePercent: 0 }]);
  }

  function updateLine(index: number, patch: Partial<QuoteItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function changeProduct(index: number, productId: string) {
    updateLine(index, { productId });
  }

  function removeLine(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {embedded ? <span /> : <Label>Line items</Label>}
        <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!products?.length}>
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lines yet — add at least one.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const product = products?.find((p) => p.id === item.productId);
            return (
              <div key={index} className="flex items-center gap-2">
                <Select value={item.productId} onValueChange={(value) => changeProduct(index, value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{product?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(products ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  className="w-24 shrink-0"
                  value={item.quantity}
                  onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                  aria-label="Quantity"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-28 shrink-0"
                  value={item.unitPrice}
                  onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                  aria-label="Unit price"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="w-24 shrink-0"
                  value={item.taxRatePercent}
                  onChange={(e) => updateLine(index, { taxRatePercent: Number(e.target.value) })}
                  aria-label="Tax rate (%)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={() => removeLine(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!embedded && items.length > 0 && (
        <div className="flex justify-end gap-6 rounded-md bg-muted/50 px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Subtotal: <span className="font-medium text-foreground">{formatMoney(summary.subtotal)}</span>
          </span>
          <span className="text-muted-foreground">
            Tax: <span className="font-medium text-foreground">{formatMoney(summary.taxTotal)}</span>
          </span>
          <span className="text-muted-foreground">
            Total: <span className="font-medium text-foreground">{formatMoney(summary.total)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
