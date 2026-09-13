import { useState, type SubmitEvent } from 'react';
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from '../api/hooks';
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
import type { ProductInput } from '../api/sales.api';
import type { Product, ProductType } from '../api/types';

const TYPE_FILTERS: { label: string; value: ProductType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Products', value: 'PRODUCT' },
  { label: 'Services', value: 'SERVICE' },
];

const EMPTY_FORM: ProductInput = { name: '', description: '', type: 'PRODUCT' };

export function ProductsPage() {
  const [type, setType] = useState<ProductType | undefined>(undefined);
  const { data, isLoading } = useProducts(type);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      type: product.type,
    });
    setErrorMessage(null);
    setShowForm(true);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const onSuccess = () => setShowForm(false);
    const onError = (error: unknown) => setErrorMessage(extractApiErrorMessage(error, 'Could not save product.'));
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: form }, { onSuccess, onError });
    } else {
      createMutation.mutate(form, { onSuccess, onError });
    }
  }

  function handleToggleActive(product: Product) {
    updateMutation.mutate({ id: product.id, input: { isActive: !product.isActive } });
  }

  function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    deleteMutation.mutate(product.id, {
      onError: (error) => alert(extractApiErrorMessage(error, 'Could not delete product.')),
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Product &amp; Service Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Items available for quotes and orders — pricing is set per deal, not from the catalog.
        </p>
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

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} item(s)</p>
        <Button type="button" size="sm" onClick={openCreate}>
          Add item
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No catalog items yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.description ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'secondary' : 'outline'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center justify-end gap-3">
                    <Button variant="link" className="h-auto p-0" onClick={() => openEdit(product)}>
                      Edit
                    </Button>
                    <Button variant="link" className="h-auto p-0" onClick={() => handleToggleActive(product)}>
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-destructive"
                      onClick={() => handleDelete(product)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit item' : 'Add item'} onClose={() => setShowForm(false)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Type</Label>
              <Select value={form.type ?? 'PRODUCT'} onValueChange={(value) => setForm({ ...form, type: value as ProductType })}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue>{form.type ?? 'PRODUCT'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">PRODUCT</SelectItem>
                  <SelectItem value="SERVICE">SERVICE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create item'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
